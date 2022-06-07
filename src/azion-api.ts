import axios, { AxiosResponse } from "axios";
import { CannotSaveFunction } from "./errors";


const DEFAULT_API_URL = 'https://api.azionapi.net';

export interface ObjectAPIResult {
    results: EdgeFunction,
}

export interface ListAPIResult {
    total_pages: number,
    links: any,
    results: EdgeFunction[],
}

export interface EdgeFunction {
    id?: number,
    name: string,
    code: string,
    language: string,
    active: boolean,
    json_args: object
}

const apiBaseHeaders = (token: string) =>
    ({
        'Accept': 'application/json; version=3',
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
    });

export class AzionApi {
    url: string;
    token: string;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    static async init(url: string = DEFAULT_API_URL, user: string, password: string): Promise<AzionApi> {
        const token = await this.getToken(url, user, password);
        return new AzionApi( url, token );
    }

    private static async getToken(url: string, user: string, password: string): Promise<string> {
        const credentialsBase64 = Buffer.from(`${user}:${password}`).toString('base64');
        try {
            const response = await axios({
                url: `${url}/tokens`,
                method: 'POST',
                headers: {
                    'Accept': 'application/json; version=3',
                    'Authorization': 'Basic ' + credentialsBase64
                }
            });
            return response.data.token;
        } catch (err: any) {
            throw new CannotSaveFunction(JSON.stringify(err.response?.data));
        }
    }

    async saveFunction(edgeFunction: EdgeFunction): Promise<EdgeFunction> {
        try {
            const response: AxiosResponse<ObjectAPIResult> = await axios({
                url: `${this.url}/edge_functions`,
                method: 'POST',
                headers: apiBaseHeaders(await this.token),
                data: edgeFunction,
            });
            return response.data.results;
        } catch(err: any) {
            try {
                // Fetch all edge functions until find one with the same name, then update it
                // For now it is not possible query a function by its name
                let nextPage = `${this.url}/edge_functions`;
                while (nextPage) {
                    const result: AxiosResponse<ListAPIResult> = await axios({
                        url: nextPage,
                        method: 'GET',
                        headers: apiBaseHeaders(await this.token),
                    });

                    for (const f of result.data.results) {
                        if (f.name === edgeFunction.name) {
                            const { code, json_args } = edgeFunction;
                            const response: AxiosResponse<ObjectAPIResult> = await axios({
                                url: `${this.url}/edge_functions/${f.id}`,
                                method: 'PATCH',
                                headers: apiBaseHeaders(await this.token),
                                data: { code, json_args },
                            });
                            return response.data.results;
                        }
                    }
                    nextPage = result.data.links.next;
                }
            } catch (err: any) {
                throw new CannotSaveFunction(JSON.stringify(err.response?.data));
            }
            throw new CannotSaveFunction(JSON.stringify(err.response?.data));
        }
    }
}
