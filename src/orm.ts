import fs = require('fs');
import rx = require('rx');
import api = require('./api');
import guice = require('guice.js');
import process = require('process');

export class Mapper implements api.IMapper {
    constructor(protected guice: guice.Guice, private context: api.IContext) {
    }

    public call<T>(model: string, method: string, ...params: any[]): rx.Observable<T> {
        const modelObj = this.guice.get<any>(model);
        if (!modelObj || !modelObj[method]) {
            return rx.Observable.throw<T>(new Error(`can't find model(${model}) method(${method})`));
        }

        return modelObj[method](this.context, ...params);
    }
}

// tslint:disable-next-line:max-classes-per-file
export class ORM extends Mapper {

    constructor(private client: api.IClient, name?: string) {
        super(new guice.Guice(), client);
        guice.load(this.guice, this.guice, name ? name : 'orm.json');
    }

    public tx<T>(block: (mapperFactory: api.IMapper) => rx.Observable<T>): rx.Observable<T> {
        return this.client.tx((tx) => {
            return block(new Mapper(this.guice, tx));
        });
    }
};
