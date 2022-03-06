import {DataCacher, Field, IDataHook} from "model-react";
import {approximateBezier} from "../sweepObject/bezier/approximateBezier";
import {getPointOnBezier} from "../sweepObject/bezier/getPointOnBezier";
import {getTangentOnBezier} from "../sweepObject/bezier/getTangentOnBezier";
import {sampleBezier} from "../sweepObject/bezier/sampleBezier";
import {IBezier} from "../sweepObject/bezier/_types/IBezier";
import {IBezierApproximationConfig} from "../sweepObject/bezier/_types/IBezierApproximationConfig";
import {IBezierNode} from "../sweepObject/bezier/_types/IBezierNode";
import {Vec2} from "../util/Vec2";
import {Vec3} from "../util/Vec3";
import {ISegment} from "./_types/ISegment";

/**
 * A class to represent subscribable state of a bezier curve and handle some of its logic
 */
export class BezierSegmentState<D extends Vec2 | Vec3> implements ISegment<D> {
    protected start: Field<D>;
    protected startControl: Field<D>;
    protected endControl: Field<D>;
    protected end: Field<D>;

    protected plainBezier = new DataCacher<IBezier<D>>(h => ({
        start: this.start.get(h),
        startControl: this.startControl.get(h),
        endControl: this.endControl.get(h),
        end: this.end.get(h),
    }));

    // Linked bezier curves that are synchronized
    protected previous = new Field<ISegment<D> | null>(null);
    protected next = new Field<ISegment<D> | null>(null);

    /**
     * Creates a bezier representation of the straight line segment from start to end
     * @param start The start point of the segment
     * @param end The end point of the segment
     */
    public constructor(start: D, end: D);

    /**
     * Creates a bezier curve with the given start and end points, and the given controls to direct the curve
     * @param start The start point of the segment
     * @param startControl The control point to direct the start of the segment
     * @param endControl The control point to direct the end of the segment
     * @param end The end point of the segment
     */
    public constructor(start: D, startControl: D, endControl: D, end: D);
    public constructor(start: D, startControl: D, endControl?: D, end?: D) {
        if (end && endControl) {
            this.start = new Field(start);
            this.startControl = new Field(startControl.sub(start as Vec3) as D);
            this.endControl = new Field(endControl.sub(end as Vec3) as D);
            this.end = new Field(end);
        } else {
            end = startControl;

            this.start = new Field(start);
            this.startControl = new Field(start);
            this.endControl = new Field(end);
            this.end = new Field(end);
        }
    }

    // Utils
    /**
     * Retrieves a point on the curve, given a position on the curve
     * @param t The position between 0 and 1
     * @param hook The hook to subscribe to changes
     * @returns The found point
     */
    public getPoint(t: number, hook?: IDataHook): D {
        return getPointOnBezier(this.getPlain(hook), t);
    }

    /**
     * Retrieves the direction that the curve has at the given position
     * @param t The position between 0 and 1
     * @param hook The hook to subscribe to changes
     * @returns The found direction
     */
    public getDirection(t: number, hook?: IDataHook): D {
        return getTangentOnBezier(this.getPlain(hook), t);
    }

    /**
     * Approximates this bezier curve using points and linear interpolation
     * @param config The configuration to subscribe to changes
     * @param hook The hook to subscribe to changes
     */
    public calculateApproximation(
        config: IBezierApproximationConfig,
        hook?: IDataHook
    ): IBezierNode<D>[] {
        return approximateBezier(this.getPlain(hook), config);
    }

    /**
     * Gets a plain representation of this bezier curve
     * @param hook The hook to subscribe to changes
     * @returns The plain object version of the bezier
     */
    public getPlain(hook?: IDataHook): IBezier<D> {
        return this.plainBezier.get(hook);
    }

    // Chaining
    /**
     * Sets the previous curve, whose end is linked to this curve
     * @param segment The curve to be linked, or null to unlink curves
     * @param sync Whether to synchronize with the set neighbor
     * @param copyDirection Whether to make sure the curves' directions should be linked
     */
    public setPreviousSegment(
        segment: ISegment<D> | null,
        sync: boolean = true,
        copyDirection: boolean = true
    ): void {
        const current = this.previous.get();
        if (segment == current) return;
        if (sync && current) current.setNextSegment(null, false);

        if (segment) {
            this.previous.set(segment);

            const newStart = segment.getEnd();
            this.start.set(newStart);

            if (copyDirection)
                this.setStartDirection(segment.getEndDirection().mul(-1) as D);
            if (sync) segment.setNextSegment(this, false);
        } else {
            this.previous.set(null);
        }
    }

    /**
     * Sets the next curve, whose start is linked to this curve
     * @param segment The curve to be linked, or null to unlink curves
     * @param sync Whether to synchronize with the set neighbor
     * @param copyDirection Whether to make sure the curves' directions should be linked
     */
    public setNextSegment(
        segment: ISegment<D> | null,
        sync: boolean = true,
        copyDirection?: boolean
    ): void {
        const current = this.next.get();
        if (segment == current) return;
        if (sync && current) current.setPreviousSegment(null, false);

        if (segment) {
            this.next.set(segment);

            const newEnd = segment.getStart();
            this.start.set(newEnd);

            if (copyDirection)
                this.setEndDirection(segment.getStartDirection().mul(-1) as D);
            if (sync) segment.setPreviousSegment(this, false);
        } else {
            this.next.set(null);
        }
    }

    /**
     * Retrieves the previously connected curve
     * @param hook The hook to subscribe to changes
     * @returns The currently connected curve that's ahead of this curve
     */
    public getPreviousSegment(hook?: IDataHook): ISegment<D> | null {
        return this.previous.get(hook);
    }

    /**
     * Retrieves the next connected curve
     * @param hook The hook to subscribe to changes
     * @returns The currently connected curve that's behind this curve
     */
    public getNextSegment(hook?: IDataHook): ISegment<D> | null {
        return this.next.get(hook);
    }

    // Getters
    public getStart(hook?: IDataHook): D {
        return this.start.get(hook);
    }
    public getEnd(hook?: IDataHook): D {
        return this.end.get(hook);
    }

    public getStartDirection(hook?: IDataHook): D {
        return this.startControl
            .get(hook)
            .sub(this.start.get(hook) as Vec3)
            .normalize() as D;
    }
    public getEndDirection(hook?: IDataHook): D {
        return this.endControl
            .get(hook)
            .sub(this.end.get(hook) as Vec3)
            .normalize() as D;
    }

    /**
     * Retrieves the control point that directs the start of the segment
     * @param hook The hook to subscribe to changes
     * @returns The control point
     */
    public getStartControl(hook?: IDataHook): D {
        return this.startControl.get(hook);
    }

    /**
     * Retrieves the control point to direct the end of the segment
     * @param hook The hook to subscribe to changes
     * @returns The control point
     */
    public getEndControl(hook?: IDataHook): D {
        return this.endControl.get(hook);
    }

    /**
     * Retrieves the direction of the control point that directs the start of the segment
     * @param hook The hook to subscribe to changes
     * @returns The control point
     */
    public getStartControlDelta(hook?: IDataHook): D {
        return this.startControl.get(hook).sub(this.start.get(hook) as Vec3) as D;
    }

    /**
     * Retrieves the direction of the control point to direct the end of the segment
     * @param hook The hook to subscribe to changes
     * @returns The control point
     */
    public getEndControlDelta(hook?: IDataHook): D {
        return this.endControl.get(hook).sub(this.end.get(hook) as Vec3) as D;
    }

    // Setters
    public setStart(vec: D, sync: boolean = true): void {
        this.start.set(vec);

        if (sync) {
            const prev = this.previous.get();
            if (prev) prev.setEnd(vec, false);
        }
    }
    public setEnd(vec: D, sync: boolean = true): void {
        this.end.set(vec);

        if (sync) {
            const next = this.next.get();
            if (next) next.setStart(vec, false);
        }
    }

    /**
     * Sets the control point that directs the start of the segment
     * @param vec The vector representing the control for the start direction
     */
    public setStartControl(vec: D): void {
        this.startControl.set(vec);
    }

    /**
     * Sets the control point that directs the end of the segment
     * @param vec The vector representing the control for the end direction
     */
    public setEndControl(vec: D): void {
        this.endControl.set(vec);
    }

    /**
     * Sets the direction of the control point that directs the start of the segment
     * @param vec The vector representing the control for the start direction
     */
    public setStartControlDelta(vec: D): void {
        this.startControl.set(vec.sub(this.start.get() as Vec3) as D);
    }

    /**
     * Sets the direction of the control point that directs the end of the segment
     * @param vec The vector representing the control for the end direction
     */
    public setEndControlDelta(vec: D): void {
        this.endControl.set(vec.sub(this.end.get() as Vec3) as D);
    }

    public setStartDirection(direction: D): void {
        const length = this.getStartControlDelta().length();
        this.setStartControlDelta(direction.normalize().mul(length) as D);
    }

    public setEndDirection(direction: D): void {
        const length = this.getEndControlDelta().length();
        this.setEndControlDelta(direction.normalize().mul(length) as D);
    }

    /**
     * Moves the start point to the new position. Also moves the start control such that the control's delta remains the same
     * @param vec The vector representing the new start position
     */
    public moveStart(vec: D): void {
        const delta = this.startControl.get().sub(this.start.get() as Vec3) as Vec3;
        this.startControl.set(vec.add(delta) as D);
        this.start.set(vec);
    }

    /**
     * Moves the end point to the new position. Also moves the end control such that the control's delta remains the same
     * @param vec The vector representing the new end position
     */
    public moveEnd(vec: D): void {
        const delta = this.endControl.get().sub(this.end.get() as Vec3) as Vec3;
        this.endControl.set(vec.add(delta) as D);
        this.end.set(vec);
    }

    // Segment approximation
    public getRecommendedApproximationPointCount(precision: number): number {
        return precision;
    }

    public approximate(points: number, skipLast: boolean): D[] {
        const nodes = sampleBezier(this.getPlain(), points);
        const out = skipLast ? nodes.slice(0, -1) : nodes;
        return out.map(({point}) => point) as D[];
    }
}