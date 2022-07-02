
export class Device {
    public id = "";
    public diy = false;
    public model = "Unknown";
    public brand = "Unknown";
    constructor(dev) {
        this.id    = dev.id;
        this.diy   = dev.diy;
        this.model = dev.model;
        this.brand = dev.brand;
    }
}