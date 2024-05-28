/**
 *
 * @typedef {"mkd-plugin:zoom-in" | "mkd-plugin:zoom-out" | "mkd-plugin:zoom-reset" | "mkd-plugin:drag" | "mkd-plugin:position-reset" | "mkd-plugin:draw:square" | "mkd-plugin:export" | "mkd-plugin:toggle-wall" | "mkd-plugin:shape-name" | "mkd-plugin:toggle-backsplash" | "mkd-plugin:rotate-left" | "mkd-plugin:rotate-right" | "mkd-plugin:delete-shape" | "mkd-plugin:enable-shape-drag" | "mkd-plugin:shape-size" | "mkd-plugin:toggle-rounded-box" | "mkd-plugin:draw:l"} MKDPluginEvent
 *
 * @typedef {"mkd-plugin:active-shape" | "mkd-plugin:shape-deleted"} MKDPluginDispatchEvent
 *
 * @typedef {Object} PayloadType
 * @property {?string} image - image path
 * @property {?Function} success - success callback
 * @property {?Function} error - error callback
 * @property {?boolean} enable - to enable of disable the drag
 * @property {?boolean} addWall - to add wall or remove
 * @property {?number} shapeId - shape unique id
 * @property {"a" | "b" | "c" | "d" | null} wall - wall name. (a | b | c | d)
 * @property {?string} shapeName - name of the shape
 */

/**
 * @param {MKDPluginEvent | MKDPluginDispatchEvent} event
 * @param {Partial<PayloadType>} event
 *
 * @returns {CustomEvent<any>}
 */
function dispatchCanvasEvent(event, payload = null) {
    const newEvent = new CustomEvent(event, { detail: payload ?? {} });
    // @ts-ignore
    document.dispatchEvent(newEvent);

    return newEvent;
}

let preventManualTriggeredEvent = false;
// @ts-ignore
jQuery(document).ready(function ($) {
    $("#zoom-in").on("click", function () {
        dispatchCanvasEvent("mkd-plugin:zoom-in");
    });
    $("#zoom-out").on("click", function () {
        dispatchCanvasEvent("mkd-plugin:zoom-out");
    });
    $("#zoom-reset").on("click", function () {
        dispatchCanvasEvent("mkd-plugin:zoom-reset");
    });
    $("#rotate-left").on("click", function () {
        if (!document.activeShape) {
            alert(
                "Hey there! Feeling a bit stuck, huh? Let’s tackle one thing at a time. First up: what shape are we dealing with here?"
            );
            return;
        }
        dispatchCanvasEvent("mkd-plugin:rotate-left", {
            shapeId: document.activeShape,
        });
    });
    $("#rotate-right").on("click", function () {
        if (!document.activeShape) {
            alert(
                "Hey there! Feeling a bit stuck, huh? Let’s tackle one thing at a time. First up: what shape are we dealing with here?"
            );
            return;
        }
        dispatchCanvasEvent("mkd-plugin:rotate-right", {
            shapeId: document.activeShape,
        });
    });
    $("#enable-drag").on("change", function () {
        dispatchCanvasEvent("mkd-plugin:drag", { enable: this.checked });
    });
    $("#enable-shape-drag").on("change", function () {
        dispatchCanvasEvent("mkd-plugin:enable-shape-drag", {
            enable: this.checked,
        });
    });
    $("#position-reset").on("click", function () {
        dispatchCanvasEvent("mkd-plugin:position-reset");
    });
    $("#draw-square").on("click", function () {
        try {
            dispatchCanvasEvent("mkd-plugin:draw:square", {
                image: "/dynamicAssets/material-2.jpeg",
                success: (resp) => console.log(resp),
                error: (resp) => console.error(resp),
            });
        } catch (e) {
            console.log(e.message);
        }
    });
    $("#export").on("click", function () {
        dispatchCanvasEvent("mkd-plugin:export");
    });
    $(".wall").on("change", function () {
        if (preventManualTriggeredEvent) return;
        if (!document.activeShape) {
            alert(
                "Hey there! Feeling a bit stuck, huh? Let’s tackle one thing at a time. First up: what shape are we dealing with here?"
            );
            $(this).prop("checked", false);
            return;
        }
        dispatchCanvasEvent("mkd-plugin:toggle-wall", {
            addWall: this.checked,
            shapeId: document.activeShape,
            wall: $(this).data("wall"),
        });
    });
    $(".backsplash").on("change", function () {
        if (preventManualTriggeredEvent) return;
        if (!document.activeShape) {
            alert(
                "Hey there! Feeling a bit stuck, huh? Let’s tackle one thing at a time. First up: what shape are we dealing with here?"
            );
            $(this).prop("checked", false);
            return;
        }
        dispatchCanvasEvent("mkd-plugin:toggle-backsplash", {
            addWall: this.checked,
            shapeId: document.activeShape,
            wall: $(this).data("wall"),
        });
    });

    // This will act as old value
    var watchActiveShape = null;
    Object.defineProperty(this, "activeShape", {
        get: function () {
            return watchActiveShape;
        },
        set: function (v) {
            watchActiveShape = v;
        },
    });
    $(document).on(
        "mkd-plugin:active-shape",
        /** @param {Event} e */
        (e) => {
            const response = e.detail;
            document.activeShape = response.id;
            const shapeElm = $("#active-shape-customization-block #shapeName");
            shapeElm.val(response.shapeName);
            shapeElm.data("val", response.shapeName);
            shapeElm.attr("data-val", response.shapeName);

            const againstTheWall = response.againstTheWall;
            if (againstTheWall) {
                Object.entries(againstTheWall)?.map(([wall, value]) => {
                    $("#wall-" + wall)?.prop("checked", value);
                });
            } else {
                $(".wall")?.prop("checked", false);
            }
            const backsplashes = response.backsplashes;
            if (backsplashes) {
                Object.entries(backsplashes)?.map(([wall, value]) => {
                    $("#backsplash-" + wall)?.prop("checked", value);
                });
            } else {
                $(".backsplash")?.prop("checked", false);
            }
            const haveRoundedCorners = response.haveRoundedCorners;
            if (haveRoundedCorners) {
                Object.entries(haveRoundedCorners)?.map(([wall, value]) => {
                    $("#can-be-rounded-" + wall)?.prop("checked", value);
                });
            } else {
                $(".can-be-rounded")?.prop("checked", false);
            }
            $("#active-shape-customization-block").fadeIn();

            const shapeWidth = $(
                "#active-shape-customization-block #shapeWidth"
            );
            shapeWidth.val(response.shapeSize.width);
            const shapeHeight = $(
                "#active-shape-customization-block #shapeHeight"
            );
            shapeHeight.val(response.shapeSize.height);
        }
    );

    // Define a flag to track whether the blur event listener should be active
    let blurEventListenerActive = true;

    function shapeNameChange() {
        const shapeNameInput = $("#shapeName");
        const old = shapeNameInput.data("val");
        const value = shapeNameInput.val();
        if (!String(value).trim()) {
            shapeNameInput.val(old);
            return;
        }

        shapeNameInput.data("val", value);
        shapeNameInput.attr("data-val", value);

        dispatchCanvasEvent("mkd-plugin:shape-name", {
            shapeId: document.activeShape,
            shapeName: value,
            error: (err) => console.error(err.message),
        });
    }

    // On Shape Name change
    $("#shapeName").on("blur keydown", function (e) {
        if (e.type === "blur") {
            blurEventListenerActive && shapeNameChange();
        } else if (e.type === "keydown" && e.key === "Enter") {
            // Temporarily disable the blur event listener
            blurEventListenerActive = false;
            shapeNameChange();
            $(this).blur();

            // Re-enable the blur event listener after a short delay
            // to wait until dom manipulation
            setTimeout(() => {
                blurEventListenerActive = true;
            }, 100);
        }
    });

    $("#shapeWidth").on("change", function () {
        const value = $(this).val();
        if (value <= 0) {
            alert("Please select a value greater than 0.");
            return;
        }
        dispatchCanvasEvent("mkd-plugin:shape-size", {
            shapeId: document.activeShape,
            width: value,
            error: (e) => console.log(`[MKD]: ${e.message}`),
        });
    });
    $("#shapeHeight").on("change", function () {
        const value = $(this).val();
        if (value <= 0) {
            alert("Please select a value greater than 0.");
            return;
        }
        dispatchCanvasEvent("mkd-plugin:shape-size", {
            shapeId: document.activeShape,
            height: value,
            error: (e) => console.log(`[MKD]: ${e.message}`),
        });
    });

    $(document).on(
        "mkd-plugin:shape-size-change",
        /** @param {Event} e */
        (e) => {
            const response = e.detail;
            if (response.id !== document.activeShape) {
                return;
            }

            const shapeWidth = $(
                "#active-shape-customization-block #shapeWidth"
            );
            shapeWidth.val(response.shapeSize.width);
            const shapeHeight = $(
                "#active-shape-customization-block #shapeHeight"
            );
            shapeHeight.val(response.shapeSize.height);
        }
    );

    $(document).on("change", ".can-be-rounded", function () {
        if (!document.activeShape) {
            alert(
                "Hey there! Feeling a bit stuck, huh? Let’s tackle one thing at a time. First up: what shape are we dealing with here?"
            );
            $(this).prop("checked", false);
            return;
        }
        dispatchCanvasEvent("mkd-plugin:toggle-rounded-box", {
            addWall: this.checked,
            shapeId: document.activeShape,
            wall: $(this).data("wall"),
            error: (e) => console.warn(`[MKD] ${e.message}`),
        });
    });
});


// Shape L

// @ts-ignore
jQuery(document).ready(function($) {
    $("#draw-l").on("click", function () {
        try {
            dispatchCanvasEvent("mkd-plugin:draw:l", {
                image: "/dynamicAssets/material-2.jpeg",
                success: (resp) => console.log(resp),
                error: (resp) => console.error(resp),
            });
        } catch (e) {
            console.log(e.message);
        }
    });
});