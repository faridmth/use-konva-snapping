import Konva from "konva";

export const useKonvaSnapping = (params) => {

    const defaultParams = {
        snapRange:params.snapRange??3,
        guidelineColor: params.guidelineColor ??"rgb(0, 161, 255)",
        guidelineDash: params.guidelineDash ?? true ,
        showGuidelines:params.showGuidelines??true,
        guidelineThickness:params.guidelineThickness??1,
        snapToStageCenter:params.snapToStageCenter??true,
        snapToStageBorders:params.snapToStageBorders??true,
        snapToShapes:params.snapToShapes??true
    }

    const getSnappingPoints = (e) => {
        const{snapToStageCenter,snapToStageBorders,snapToShapes} = defaultParams
        const stage = e.target.getStage();
        const vertical = [];
        const horizontal = [];
        if(snapToStageCenter){
            vertical.push(stage.attrs.width / 2)
            horizontal.push(stage.attrs.height / 2)
        }
        if(snapToStageBorders){
            horizontal.push(0,stage.attrs.height)
            vertical.push(0,stage.attrs.width)
        }
        if(snapToShapes){
            stage.children.forEach((layer) => {
                layer.children.forEach((obj) => {
                    const box = obj.getClientRect();
    
                    if (obj.getType() === "Shape" && e.target !== obj && obj.getName()!=="guid-line") {
                        vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
                        horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
                    }
                });
            });
        }

        return { vertical, horizontal };
    };

    const createLine = (Layer, isHorizontal, lineX, lineY) => {
        const{guidelineColor,
            showGuidelines,
            guidelineThickness,
            guidelineDash
            }=defaultParams
        if(!showGuidelines) return
        const points = isHorizontal ? [-6000, 0, 6000, 0] : [0, -6000, 0, 6000];
        const line = new Konva.Line({
            points,
            stroke: guidelineColor,
            strokeWidth: guidelineThickness,
            name: "guid-line",
            dash: guidelineDash?[4, 6]: [0, 0],
        });
        Layer.add(line);
        line.absolutePosition({ x: lineX, y: lineY });
    };

    const handleDragging = (e) => {

        const Layer = e.target.parent;
        // Clear existing guidelines
        Layer.find(".guid-line").forEach((line) => line.destroy());
        const { horizontal, vertical } = getSnappingPoints(e);
        let newPos = { x: e.target.absolutePosition().x, y: e.target.absolutePosition().y };
        let guideLinesX = []
        let guideLinesY = []
        const {snapRange} = defaultParams
        // Snap vertically
        vertical.forEach((breakPoint) => {
            if (Math.abs(e.target.getClientRect().x - breakPoint) <= snapRange) {
                newPos.x = breakPoint + e.target.absolutePosition().x - e.target.getClientRect().x;
                guideLinesX.push(breakPoint)
            }
            if (Math.abs(e.target.getClientRect().x - breakPoint + e.target.getClientRect().width / 2) <= snapRange) {
                newPos.x = breakPoint + e.target.absolutePosition().x - e.target.getClientRect().x - e.target.getClientRect().width / 2;
                guideLinesX.push(breakPoint)

            }
            if (Math.abs(e.target.getClientRect().x - breakPoint + e.target.getClientRect().width) <= snapRange) {
                newPos.x = breakPoint + e.target.absolutePosition().x - e.target.getClientRect().x - e.target.getClientRect().width;
                guideLinesX.push(breakPoint)
            }
        });
        e.target.absolutePosition(newPos)
        guideLinesX.forEach(line=>{
            if (Math.round(e.target.getClientRect().x - line) ===0 ||
            Math.round(e.target.getClientRect().x - line + e.target.getClientRect().width / 2)===0 ||
            Math.round(e.target.getClientRect().x - line + e.target.getClientRect().width) ===0)
            {
              createLine(Layer, false, line, 0);    
            }
        })
        // Snap horizontally
        horizontal.forEach((breakPoint) => {
            if (Math.abs(e.target.getClientRect().y - breakPoint) <= snapRange) {
                newPos.y = breakPoint + e.target.absolutePosition().y - e.target.getClientRect().y;
                guideLinesY.push(breakPoint)
            }
            if (Math.abs(e.target.getClientRect().y - breakPoint + e.target.getClientRect().height) <= snapRange) {
                newPos.y = breakPoint + e.target.absolutePosition().y - e.target.getClientRect().y - e.target.getClientRect().height;
                guideLinesY.push(breakPoint)
            }
            if (Math.abs(e.target.getClientRect().y - breakPoint + e.target.getClientRect().height / 2) <= snapRange) {
                newPos.y = breakPoint + e.target.absolutePosition().y - e.target.getClientRect().y - e.target.getClientRect().height / 2;
                guideLinesY.push(breakPoint)
            }
        });
        e.target.absolutePosition(newPos);
        guideLinesY.forEach(line=>{
            if (Math.round(e.target.getClientRect().y - line) ===0 ||
            Math.round(e.target.getClientRect().y - line + e.target.getClientRect().height)===0 ||
            Math.round(e.target.getClientRect().y - line + e.target.getClientRect().height / 2) ===0)
            {
                createLine(Layer, true, 0, line);    
            }
        })
    };

    const handleResizing = (e) => {
        if (e.currentTarget.getActiveAnchor() === 'rotater') return
        const Layer = e.target.parent;
        const { snapRange } = defaultParams;
        const { horizontal, vertical } = getSnappingPoints(e);
        e.currentTarget.anchorDragBoundFunc((oldAbsPos, newAbsPos, event) => {
            let bounds = { x: newAbsPos.x, y: newAbsPos.y };
            Layer.find(".guid-line").forEach((line) => line.destroy());
            for (let breakPoint of vertical) {
                if (Math.abs(newAbsPos.x - breakPoint) <= snapRange) {
                    bounds.x = breakPoint;
                    createLine(Layer, false, breakPoint, 0);
                    break;
                }
            }
            for (let breakPoint of horizontal) {
                if (Math.abs(newAbsPos.y - breakPoint) <= snapRange) {
                    bounds.y = breakPoint;
                    createLine(Layer, true, 0,breakPoint);
                    break;
                }
            }

            return bounds;
        })
    };   
    
    const handleResizeEnd = (e) =>{
        const Layer = e.target.parent;
        Layer.find(".guid-line").forEach((line) => line.destroy());
    }
    const handleDragEnd = (e) =>{
        const Layer = e.target.parent;
        Layer.find(".guid-line").forEach((line) => line.destroy());
    }

    return { handleDragging,handleResizing,handleResizeEnd,handleDragEnd };
};