import {TextField} from "@mui/material";
import {useDataHook} from "model-react";
import {FC, useCallback, useState} from "react";
import {useCrossSectionEditorState} from "./crossSections/CrossSectionEditorStateContext";

// TO-DO add props for this component
export const RotationScaleMenu: FC = () => {
    const [h] = useDataHook();

    const editorState = useCrossSectionEditorState();
    const crossSection = editorState.getSelectedCrossSection(h);
    const rotation = (crossSection.getRotation(h) / Math.PI) * 180;
    const setRotation = useCallback(
        (textValue: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
            const value = Number(textValue.target.value);
            crossSection.setRotation((value / 180) * Math.PI);
        },
        [crossSection]
    );

    return (
        <div
            css={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "rgba(177,212,224,0.7)",
                margin: "10px",
                borderRadius: "4px",
                maxWidth: "150px",
                padding: "5px",
                color: "#145DA0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
                minHeight: "110px",
            }}>
            <TextField
                id="standard-basic"
                type="number"
                label="Rotation"
                value={rotation}
                size="small"
                onChange={setRotation}
                inputProps={{
                    style: {
                        borderRadius: "4px",
                        borderColor: "transparent",
                    },
                }}
            />
            <TextField
                id="standard-basic"
                type="number"
                label="Scale"
                value={crossSection.getScale(h)}
                size="small"
                onChange={value => crossSection.setScale(Number(value.target.value))}
            />
        </div>
    );
};