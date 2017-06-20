import rx = require('rx');
import nsql = require('../src');
import log4js = require('log4js');
const logger = log4js.getLogger('nsql');
class PGTx implements nsql.ITx {
    public prepare<T>(stmt: string, ...params: any[]): rx.Observable<T> {
        return rx.Observable.empty<any>();
    }

    public exec<T>(stmt: string): rx.Observable<T> {
        return rx.Observable.empty<any>();
    }

    public commit<T>(t?: T): rx.Observable<T> {
        if (t) {
            return rx.Observable.just(t);
        }

        return rx.Observable.empty<T>();
    }

    public rollback<T>(t?: T): rx.Observable<T> {
        if (t) {
            return rx.Observable.just(t);
        }

        return rx.Observable.empty<T>();
    }

    public procedure<T>(name: string, ...params: any[]): rx.Observable<T> {
        return rx.Observable.empty<T>();
    }
}

// tslint:disable-next-line:max-classes-per-file
export default class PGMock implements nsql.IContextWithTx {
    constructor(private config: nsql.IContextConfig) {

    }

    public prepare<T>(stmt: string, ...params: any[]): rx.Observable<T> {
        logger.debug('', params);
        return rx.Observable.just<any>({});
    }

    public exec<T>(stmt: string): rx.Observable<T> {
        return rx.Observable.just<any>(1);
    }
    /**
     * create a new transaction
     * @returns ITx
     */
    public tx<T>(block: (context: nsql.ITx) => rx.Observable<T>): rx.Observable<T> {
        return block(new PGTx());
    }

    public procedure<T>(name: string, ...params: any[]): rx.Observable<T> {
        return rx.Observable.empty<T>();
    }
};