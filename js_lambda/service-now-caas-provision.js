function run(args, ctx) {
    load('https://raw.githubusercontent.com/GalacticFog/lambda-examples/1.5/js_lambda/gestalt-sdk.js');
    log("***** begin servicenow caas provisioning ************\n");

    args = JSON.parse( args );
    ctx  = JSON.parse( ctx );

    var wrk_name = args.workspace_name;
    if ( ! wrk_name ) {
        log("ERROR: missing argument 'workspace_name'");
        throw "ERROR: missing argument 'workspace_name'";
    }

    META = get_meta(args, ctx.creds);
    log("[init] found meta: " + META.url, LoggingLevels.DEBUG);

    var equity_org = find_org("galactic-capital.equity.devs");
    log("found equity org:" + equity_org.id + "\n");

    var crud_lambda_id = get_env("CRUD_LAMBDA");

    var workspace = create_workspace(equity_org, java.util.UUID.randomUUID().toString(), wrk_name);
    var environment = create_environment(equity_org, workspace, "dev", "Development", EnvironmentTypes.DEVELOPMENT);
    var policy = create_policy(equity_org, environment, "default-sn-policies");
    create_event_rule(equity_org, policy,
        "sn-container_crud", "Track container CRUD events in ServiceNow",
        crud_lambda_id,
        [ "container.create.post", "container.delete.post", "container.update.post", "container.scale.post" ]
    );
    create_limit_rule(equity_org, policy,
        "cpu-limit", "Limit CPU to 0.1", [ "container.create", "container.update" ],
        "container.properties.cpus", "<=", 0.1
    );
    create_limit_rule(equity_org, policy,
        "mem-limit", "Limit memory to 256", [ "container.create", "container.update" ],
        "container.properties.memory", "<=", 256
    );
    create_limit_rule(equity_org, policy,
        "inst-limit", "Limit number of instances to 2", [ "container.create", "container.update", "container.scale" ],
        "container.properties.num_instances", "<=", 2
    );

    log("***** done servicenow caas provisioning ************\n");
    return JSON.stringify({
        url: "https://demo.galacticfog.com/galactic-capital.equity.devs/hierarchy/" + workspace.id + "/environments/" + environment.id
    });
}



