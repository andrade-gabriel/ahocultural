export interface CompanyEntity {
    id: string;
    name: string;
    address: {
        street: string;         // "Av. Paulista"
        number?: string;        // "1578"
        complement?: string;    // "Conj. 1203"
        district?: string;      // "Bela Vista"
        city: string;           // "São Paulo"
        state: string;          // "SP"
        state_full?: string;    // "São Paulo"
        postal_code?: string;   // "01310-200"
        country: string;        // "Brasil"
        country_code: string;   // "BR"
    };
    geo: {
        lat: number | null;     // WGS84
        lng: number | null;     // WGS84
    };
    formatted_address?: string;
    created_at: Date;
    updated_at: Date;
    active: boolean;
}

export interface CompanyRequest {
    id: string;
    name: string;
    address: {
        street: string;         // "Av. Paulista"
        number?: string;        // "1578"
        complement?: string;    // "Conj. 1203"
        district?: string;      // "Bela Vista"
        city: string;           // "São Paulo"
        state: string;          // "SP"
        state_full?: string;    // "São Paulo"
        postal_code?: string;   // "01310-200"
        country: string;        // "Brasil"
        country_code: string;   // "BR"
    };
    geo: {
        lat: number | null;     // WGS84
        lng: number | null;     // WGS84
    };
    active: boolean;
}

export interface CompanyToggleRequest {
    active: boolean;
}