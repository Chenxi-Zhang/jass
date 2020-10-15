class Location {
    public start:number;
    public end:number;
    public constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
    public equals(that: Location) {
        return this.start === that.start && this.end === that.end;
    }
}

export { Location};
