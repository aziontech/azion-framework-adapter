import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { AzionApi, EdgeFunction } from '../../dist/azion-api';

function getEdgeFunctionData(): EdgeFunction {
    const edgeFunction = {
        name: 'function_test',
        code: 'console.log(\'test\')',
        language: 'javascript',
        active: true,
        json_args: {
            'key': 'value'
        }
    };
    return edgeFunction;
}

describe('azion-api', async () => {
    const axiosMock = new MockAdapter(axios);
    const azionApiUrl = "http://azion.api.domain";
    const user = 'user.name@domain.com';
    const password = 'password';

    afterEach(() => axiosMock.reset());

    it('should fetch token api', async () => {
        axiosMock.onPost(`${azionApiUrl}/tokens`)
            .reply((config) => {
                expect(config.headers).to.have.property('Authorization');
                expect(config.headers).to.own.include({ 'Accept': 'application/json; version=3' });
                return [201, { token: '#token#' }];
            });

        const azionApi = AzionApi.init(azionApiUrl, user, password);
        return azionApi.should.be.fulfilled;
    });

    it('should fail on fetching token', async () => {
        axiosMock.onPost(`${azionApiUrl}/tokens`)
            .reply(401);

        const azionApi = AzionApi.init(azionApiUrl, user, password);
        return azionApi.should.be.rejected;
    });

    it('should save an edge function', async () => {
        const edgeFunction = getEdgeFunctionData();

        axiosMock.onPost(`${azionApiUrl}/tokens`).reply(201, { token: '#token#' });
        axiosMock.onPost(`${azionApiUrl}/edge_functions`)
            .reply((config) => {
                expect(config.headers).to.have.property('Authorization');
                expect(config.headers).to.own.include({ 'Accept': 'application/json; version=3' });
                return [201, {
                    results: {
                        id: 1,
                        ...edgeFunction
                    }
                }];
            });

        const azionApi = await AzionApi.init(azionApiUrl, user, password);
        const savedEdgeFunction = azionApi.saveFunction(edgeFunction);

        return savedEdgeFunction.should.eventually.to.include({ id: 1 })
            .then(() => expect(axiosMock.history.post).to.have.lengthOf(2));
    });

    it('should update an edge function if it exists', async () => {
        const edgeFunction = getEdgeFunctionData();
        edgeFunction.id = 1;

        axiosMock.onPost(`${azionApiUrl}/tokens`).reply(201, { token: '#token#' });
        axiosMock.onPost(`${azionApiUrl}/edge_functions`).reply(400);
        axiosMock.onGet(`${azionApiUrl}/edge_functions`)
            .reply(200, {
                total_pages: 1,
                results:[edgeFunction]
            });
        axiosMock.onPatch(`${azionApiUrl}/edge_functions/${edgeFunction.id}`)
            .reply(200, { results: { edgeFunction } });

        const azionApi = await AzionApi.init(azionApiUrl, user, password);
        const savedEdgeFunction = azionApi.saveFunction(edgeFunction);

        return savedEdgeFunction.should.be.fulfilled
            .then(() => expect(axiosMock.history.patch).to.have.lengthOf(1));
    });

    it('should fail on saving edge function', async () => {
        const edgeFunction = getEdgeFunctionData();

        axiosMock.onPost(`${azionApiUrl}/tokens`).reply(201, { token: '#token#' });
        axiosMock.onAny(`${azionApiUrl}/edge_functions`)
            .reply(400);

        const azionApi = await AzionApi.init(azionApiUrl, user, password);
        const createdEdgeFunction = azionApi.saveFunction(edgeFunction);
        return createdEdgeFunction.should.be.rejected;
    });
});
