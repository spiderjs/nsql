import rx = require('rx');
import path = require('path');
import process = require('process');
import util = require('util');
import api = require('./api');
import assert = require('assert');
import log4js = require('log4js');
const logger = log4js.getLogger('nsql');

export class TxFacade implements api.ITx {
    constructor(
        private cachedSQLs: Map<string, string>,
        private cachedProcedures: Map<string, any>,
        private tx: api.ITx) {

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
        return this.tx.prepare<T>(stmt, ...params);
    }

    public exec<T>(sql: string): rx.Observable<T> {
        if (sql.startsWith('@')) {
            const name = sql.substr(1);
            if (!this.cachedSQLs.has(name)) {
                throw new Error(`unknown cached SQL:${name}`);
            }

            sql = this.cachedSQLs.get(name) as string;
        }

        return this.tx.exec<T>(sql);
    }

    public rollback<T>(t?: T): rx.Observable<T> {
        return this.tx.rollback(t);
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
}