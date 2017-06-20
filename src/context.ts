import rx = require('rx');
import path = require('path');
import process = require('process');
import util = require('util');
import api = require('./api');
import txfacade = require('./tx');
import assert = require('assert');
import log4js = require('log4js');
import guice = require('guice.js');
const logger = log4js.getLogger('nsql');

export class ContextFacade implements api.IClient {
    ;
    private cachedSQLs = new Map<string, string>();
    private cachedProcedures = new Map<string, any>();
    private guice = new guice.Guice();

    constructor(private name: string, private context: api.IContextWithTx) {
    }

    public prepare<T>(stmt: string, ...params: any[]): rx.Observable<T> {
        if (stmt.startsWith('@')) {
            const name = stmt.substr(1);
            if (!this.cachedSQLs.has(name)) {
                throw new Error(`unknown cached SQL:${name}`);
            }

            stmt = this.cachedSQLs.get(name) as string;
        }
        logger.debug(`${stmt}`, JSON.stringify(params));
        return this.context.prepare<T>(stmt, ...params);
    }

    public exec<T>(sql: string): rx.Observable<T> {
        if (sql.startsWith('@')) {
            const name = sql.substr(1);
            if (!this.cachedSQLs.has(name)) {
                throw new Error(`unknown cached SQL:${name}`);
            }

            sql = this.cachedSQLs.get(name) as string;
        }
        return this.context.exec<T>(sql);
    }

    public tx<T>(block: (context: api.ITx) => rx.Observable<T>): rx.Observable<T> {
        return this.context.tx<T>((tx) => {
            return block(new txfacade.TxFacade(this.cachedSQLs, this.cachedProcedures, tx));
        });
    }

    public cacheSQL(name: string, sql: string): this {
        this.cachedSQLs.set(name, sql);
        return this;
    }
    public cacheProcedure<T>(name: string, block: (...params: any[]) => T): this {
        this.cachedProcedures.set(name, block);
        return this;
    }

    public procedure<T>(name: string, ...params: any[]): rx.Observable<T> {
        if (!this.cachedProcedures.has(name)) {
            throw new Error(`unknown cached procedure:${name}`);
        }

        const block = this.cachedProcedures.get(name) as api.Procedure<T>;
        try {
            return block(this, ...params);
        } catch (error) {
            return rx.Observable.throwError<T>(error as Error);
        }
    }
};

