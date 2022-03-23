import React from "react";
import {Vec2} from "../../../../../util/Vec2";

/**
 * An event handler to handle interactions with the plane
 * @param evt The original mouse event
 * @param worldPoint The mouse location in world coordinates
 * @param worldDelta The mouse's movement in world units
 */
export type IInteractionHandler = (
    evt: React.MouseEvent<HTMLDivElement>,
    worldPoint: Vec2,
    worldDelta: Vec2
) => void;