import { DefaultResponse } from "@utils/response/types";
import { APIGatewayProxyEvent } from "aws-lambda";
import { listCitiesByStateAsync, listCountriesAsync, listStatesByCountryAsync } from "domain/geo/store";
import { config } from "./config";
import { Country, State, City } from "domain/geo/types";

export async function getCountriesAsync(): Promise<DefaultResponse> {
    const countries: Country[] = await listCountriesAsync(config);
    if (countries) {
        return {
            success: true,
            data: countries
        };
    }
    return {
        success: true,
        data: null
    };
}

export async function getStatesByCountryAsync(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const idParam = event.pathParameters?.countryId;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    if (id) {
        const states: State[] = await listStatesByCountryAsync(config, id);
        if (states) {
            return {
                success: true,
                data: states
            };
        }
        return {
            success: true,
            data: null
        };
    }

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}

export async function getCitiesByStateAsync(event: APIGatewayProxyEvent): Promise<DefaultResponse> {
    const idParam = event.pathParameters?.stateId;
    const id: number | undefined = idParam ? parseInt(idParam, 10) : undefined;
    if (id) {
        const cities: City[] = await listCitiesByStateAsync(config, id);
        if (cities) {
            return {
                success: true,
                data: cities
            };
        }
        return {
            success: true,
            data: null
        };
    }

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}