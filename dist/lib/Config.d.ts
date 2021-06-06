export declare class Config {
    client_id: string;
    secret: string;
    region: string;
    deviceId: string;
    devices: Device[];
    constructor(client_id?: string, secret?: string, region?: string, deviceId?: string, devices?: object[]);
}
export declare class Device {
    remoteId: string;
    constructor(dev: any);
}
//# sourceMappingURL=Config.d.ts.map