import api = require('./api');
import path = require('path');
import process = require('process');
import config = require('config');
import log4js = require('log4js');
import context = require('./context');
import guice = require('guice.js');
const logger = log4js.getLogger('nsql');


export class DataSource implements api.IDataSource {
    private guice = new guice.Guice();
    private ds = new Map<string, context.ContextFacade>();

    constructor() {

        const datasource = config.get<any>('nsql.datasource');

        let rootpath;

        if (config.has('nsql.root')) {
            rootpath = config.get<string>('nsql.root');
        }

        if (!rootpath) {
            rootpath = path.join(process.cwd(), 'dist');
        }

        if (rootpath.startsWith('.')) {
            rootpath = path.join(process.cwd(), rootpath);
        }

        logger.debug(`rootpath: ${rootpath}`);

        for (const name in datasource) {
            if (datasource[name]) {
                logger.debug(`load datasource(${name}) -> ${JSON.stringify(datasource[name])}`);

                const contextConfig = datasource[name] as api.IContextConfig;

                this.guice.bind(name, new guice.Module(this.guice, rootpath, {
                    inject: [
                        'config:' + name,
                    ],
                    module: contextConfig.driver,
                    name,
                    singleton: true,
                }).factory());

                this.guice.bind('config:' + name, () => contextConfig);

                this.ds.set(name, new context.ContextFacade(name, this.guice.get<api.IContextWithTx>(name)));
            }

        }
    }

    public get(name: string): api.IClient {
        const context = this.ds.get(name);
        if (!context) {
            throw new Error(`unknown datasource ${name}`);
        }

        return context;
    }
};
