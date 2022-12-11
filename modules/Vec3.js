import { randomRange } from './Utils.js';

export class Vec3 {
    static zero() {
        return new Vec3(0, 0, 0);
    }

    static positiveX() { return new Vec3(1, 0, 0); }
    static negativeX() { return new Vec3(-1, 0, 0); }
    static positiveY() { return new Vec3(0, 1, 0); }
    static negativeY() { return new Vec3(0, -1, 0); }
    static positiveY() { return new Vec3(0, 0, 1); }
    static negativeY() { return new Vec3(0, 0, -1); }

    static randomUnit() {
        const x = randomRange(-1, 1);
        const y = randomRange(-1, 1);
        const z = randomRange(-1, 1);
        const v = new Vec3(x, y, z);

        return v.normalise();
    }

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    dot(rhs) {
        return this.x * rhs.x
            + this.y * rhs.y
            + this.z * rhs.z;
    }

    magnitudeSquared() {
        return this.dot(this);
    }

    magnitude() {
        return Math.hypot(this.x, this.y, this.z);
    }

    normalise() {
        const recip = 1 / this.magnitude();

        this.x *= recip;
        this.y *= recip;
        this.z *= recip;

        return this;
    }

    isNonZero() {
        return Math.abs(this.x) > 0.01
            || Math.abs(this.y) > 0.01
            || Math.abs(this.z) > 0.01;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;

        return this;
    }

    add(rhs, into) {
        into = into || Vec3.zero();

        into.x = this.x + rhs.x;
        into.y = this.y + rhs.y;
        into.z = this.z + rhs.z;

        return into;
    }

    addAssign(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
        this.z += rhs.z;

        return this;
    }

    sub(rhs, into) {
        into = into || Vec3.zero();

        into.x = this.x - rhs.x;
        into.y = this.y - rhs.y;
        into.z = this.z - rhs.z;

        return into;
    }

    subAssign(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;
        this.z -= rhs.z;

        return this;
    }

    mul(rhs, into) {
        into = into || Vec3.zero();

        into.x = this.x * rhs;
        into.y = this.y * rhs;
        into.z = this.z * rhs;

        return into;
    }

    mulAssign(rhs) {
        this.x *= rhs;
        this.y *= rhs;
        this.z *= rhs;

        return this;
    }

    div(rhs, into) {
        return this.mul(1 / rhs, into);
    }

    divAssign(rhs) {
        return this.mulAssign(1 / rhs);
    }

    copyFrom(rhs) {
        this.x = rhs.x;
        this.y = rhs.y;
        this.z = rhs.z;
    }
}
