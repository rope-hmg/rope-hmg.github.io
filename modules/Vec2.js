import { randomRange } from './Utils.js';

export class Vec2 {
    static zero() {
        return new Vec2(0, 0);
    }

    static positiveX() { return new Vec2( 1,  0); }
    static negativeX() { return new Vec2(-1,  0); }
    static positiveY() { return new Vec2( 0,  1); }
    static negativeY() { return new Vec2( 0, -1); }

    static randomUnit() {
        const x = randomRange(-1, 1);
        const y = randomRange(-1, 1);
        const v = new Vec2(x, y);

        return v.normalise();
    }

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    dot(rhs) {
        return this.x * rhs.x
             + this.y * rhs.y;
    }

    magnitudeSquared() {
        return this.dot(this);
    }

    magnitude() {
        return Math.hypot(this.x, this.y);
    }

    normalise() {
        const recip = 1 / this.magnitude();

        this.x *= recip;
        this.y *= recip;

        return this;
    }

    rotate(angle) {
        const { x, y } = this;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;

        return this;
    }

    isNonZero() {
        return Math.abs(this.x) > 0.01
            || Math.abs(this.y) > 0.01;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;

        return this;
    }

    add(rhs, into) {
        into = into || Vec2.zero();

        into.x = this.x + rhs.x;
        into.y = this.y + rhs.y;

        return into;
    }

    addAssign(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;

        return this;
    }

    sub(rhs, into) {
        into = into || Vec2.zero();

        into.x = this.x - rhs.x;
        into.y = this.y - rhs.y;

        return into;
    }

    subAssign(rhs) {
        this.x -= rhs.x;
        this.y -= rhs.y;

        return this;
    }

    mul(rhs, into) {
        into = into || Vec2.zero();

        into.x = this.x * rhs;
        into.y = this.y * rhs;

        return into;
    }

    mulAssign(rhs) {
        this.x *= rhs;
        this.y *= rhs;

        return this;
    }

    div(rhs, into) {
        return this.mul(1 / rhs, into);
    }

    divAssign(rhs) {
        return this.mulAssign(1 / rhs);
    }

    copy(rhs) {
        this.x = rhs.x;
        this.y = rhs.y;
    }
}
