import { only, skip, slow, suite, test, timeout } from 'mocha-typescript';
import rx = require('rx');
import nsql = require('../src');
import assert = require('assert');

@suite('datasource test')
class DataSourceTest {
    @test('create datasource')
    public createDataSource(done: any) {
        const ds = new nsql.DataSource();

        const cnn = ds.get('pgtest');

        cnn.cacheSQL('test', 'select * from test');
        cnn.cacheProcedure('test', (context) => {
            return context.exec('sql');
        });

        cnn.prepare('@test', 1, 2, 3, 4)
            .flatMap(() => {
                return cnn.procedure<number>('test');
            })
            .map((c) => {
                assert(c === 1);
                return c;
            })
            .subscribe((c) => {
                done();
            }, (error) => {
                done(error);
            });
    }
};

