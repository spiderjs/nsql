import rx = require('rx');


export interface IContext {

    prepare<T>(stmt: string, ...params: any[]): rx.Observable<T>;

    exec<T>(sql: string): rx.Observable<T>;

    procedure<T>(name: string, ...params: any[]): rx.Observable<T>;
};

export interface ITx extends IContext {
    rollback<T>(t?: T): rx.Observable<T>;
};

export interface IContextWithTx extends IContext {
    tx<T>(block: (context: ITx) => rx.Observable<T>): rx.Observable<T>;
}

export type Procedure<T> = (context: IContext, ...params: any[]) => rx.Observable<T>;

export interface IClient extends IContextWithTx {
    cacheSQL(name: string, sql: string): this;

    cacheProcedure<T>(name: string, block: (context: IContext, ...params: any[]) => rx.Observable<T>): this;
}

export interface IDataSource {
    /**
     * return datasource context by name
     * @param  {string} name datasource name
     * @returns IContext data source context object
     */
    get(name: string): IClient;
};

export interface IContextConfig {
    driver: string; // database url
    params: any;
};

export interface IContextConstructable {
    new (config: IContextConfig): IContext;
};


export interface IMapper {
    call<T>(model: string, method: string, ...params: any[]): rx.Observable<T>;
};
