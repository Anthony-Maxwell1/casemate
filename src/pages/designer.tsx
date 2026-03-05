import { useState } from "react";

export interface Phone {
  width: number;
  height: number;
  depth: number;
  cornerRadius: number;
  cameras: {
    position: [number, number];
    shape: "circle" | "rectangle";
    radius: number;
  }[];
  buttons: {
    position: [number, number];
    shape: "circle" | "rectangle";
    size: [number, number];
  }[];
}

export interface Cutout {
  shape: "circle" | "rectangle";
  position: [number, number];
  size?: [number, number];
  radius?: number;
  face?: "back" | "left" | "right";
}

export default function Designer() {
  const [phone, setPhone] = useState<Phone>({
    width: 70,
    height: 120,
    depth: 8,
    cornerRadius: 0,
    cameras: [
      { position: [35, 20], shape: "circle", radius: 6 },
      { position: [35, 32], shape: "circle", radius: 2 },
    ],
    buttons: [
      { position: [4, 30], shape: "rectangle", size: [3, 14] },
      { position: [4, 60], shape: "rectangle", size: [3, 28] },
    ],
  });

  const cmToPx = 5;

  const leftButtons = phone.buttons
    .filter((b) => b.position[0] <= phone.width * 0.3)
    .map((b) => ({
      shape: b.shape,
      face: "left" as const,
      position: [phone.depth / 2, b.position[1]] as [number, number],
      size: b.size,
    }));

  const rightButtons = phone.buttons
    .filter((b) => b.position[0] >= phone.width * 0.7)
    .map((b) => ({
      shape: b.shape,
      face: "right" as const,
      position: [phone.depth / 2, b.position[1]] as [number, number],
      size: b.size,
    }));

  const backCutouts = phone.cameras.map((c) => ({
    shape: c.shape,
    face: "back" as const,
    position: c.position,
    radius: c.radius,
  }));

  const updatePhone = (key: keyof Phone, value: number) => {
    setPhone((prev) => ({ ...prev, [key]: value }));
  };

  const updateCamera = (
    idx: number,
    key: string,
    value: number | [number, number],
  ) => {
    setPhone((prev) => {
      const cameras = [...prev.cameras];
      cameras[idx] = { ...cameras[idx], [key]: value };
      return { ...prev, cameras };
    });
  };

  const addCamera = () => {
    setPhone((prev) => ({
      ...prev,
      cameras: [
        ...prev.cameras,
        {
          position: [prev.width / 2, prev.height / 2] as [number, number],
          shape: "circle",
          radius: 5,
        },
      ],
    }));
  };

  const removeCamera = (idx: number) => {
    setPhone((prev) => ({
      ...prev,
      cameras: prev.cameras.filter((_, i) => i !== idx),
    }));
  };

  const updateButton = (
    idx: number,
    key: string,
    value: number | [number, number] | string,
  ) => {
    setPhone((prev) => {
      const buttons = [...prev.buttons];
      buttons[idx] = { ...buttons[idx], [key]: value };
      return { ...prev, buttons };
    });
  };

  const addButton = () => {
    setPhone((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          position: [0, prev.height / 2] as [number, number],
          shape: "rectangle",
          size: [3, 12] as [number, number],
        },
      ],
    }));
  };

  const removeButton = (idx: number) => {
    setPhone((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
  };

  const renderCutout = (cutout: Cutout, idx: number) => {
    if (cutout.shape === "circle") {
      const r = (cutout.radius || 0) * cmToPx;
      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: cutout.position[0] * cmToPx - r,
            top: cutout.position[1] * cmToPx - r,
            width: r * 2,
            height: r * 2,
            background: "black",
            borderRadius: "50%",
          }}
        />
      );
    } else if (cutout.shape === "rectangle") {
      const w = (cutout.size ? cutout.size[0] : 0) * cmToPx;
      const h = (cutout.size ? cutout.size[1] : 0) * cmToPx;
      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: cutout.position[0] * cmToPx - w / 2,
            top: cutout.position[1] * cmToPx - h / 2,
            width: w,
            height: h,
            background: "black",
          }}
        />
      );
    }
    return null;
  };

  const numberField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min = 0,
    max = 200,
  ) => (
    <div className="flex items-center gap-2 mb-2">
      <label className="w-28 text-sm text-gray-700">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 bg-white text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm"
      />
    </div>
  );

  return (
    <div className="flex gap-8 p-8 min-h-screen bg-white">
      {/* Controls */}
      <div className="w-96 shrink-0 space-y-4">
        <div className="flex-row flex gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Case Designer</h1>
          <a
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white hover:cursor-pointer"
            href={`/designer/generate?phone=${encodeURIComponent(JSON.stringify(phone))}`}
          >
            Generate Case
          </a>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Phone Dimensions</h3>
          {numberField("Width (mm)", phone.width, (v) =>
            updatePhone("width", v),
          )}
          {numberField("Height (mm)", phone.height, (v) =>
            updatePhone("height", v),
          )}
          {numberField("Depth (mm)", phone.depth, (v) =>
            updatePhone("depth", v),
          )}
          <p className="text-sm text-gray-600">Note: Corner radius will be available on next page, as it is not a required measurement for defining your phone, rather used to fine tune the case.</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Cameras</h3>
          {phone.cameras.map((cam, idx) => (
            <div key={idx} className="mb-3 p-3 bg-white rounded-lg border border-gray-200 relative">
              <button
                onClick={() => removeCamera(idx)}
                className="absolute top-2 right-2 text-red-500 text-sm hover:text-red-700"
              >
                ✕
              </button>
              <p className="text-xs text-gray-500 mb-2">Camera {idx + 1}</p>
              {numberField("X", cam.position[0], (v) =>
                updateCamera(idx, "position", [v, cam.position[1]]),
              )}
              {numberField("Y", cam.position[1], (v) =>
                updateCamera(idx, "position", [cam.position[0], v]),
              )}
              {numberField("Radius", cam.radius, (v) =>
                updateCamera(idx, "radius", v),
              )}
            </div>
          ))}
          <button
            onClick={addCamera}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-3 py-1 rounded text-sm"
          >
            + Add Camera
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Buttons</h3>
          {phone.buttons.map((btn, idx) => (
            <div key={idx} className="mb-3 p-3 bg-white rounded-lg border border-gray-200 relative">
              <button
                onClick={() => removeButton(idx)}
                className="absolute top-2 right-2 text-red-500 text-sm hover:text-red-700"
              >
                ✕
              </button>
              <p className="text-xs text-gray-500 mb-2">Button {idx + 1}</p>
              {numberField("X", btn.position[0], (v) =>
                updateButton(idx, "position", [v, btn.position[1]]),
              )}
              {numberField("Y", btn.position[1], (v) =>
                updateButton(idx, "position", [btn.position[0], v]),
              )}
              {numberField("Width", btn.size[0], (v) =>
                updateButton(idx, "size", [v, btn.size[1]]),
              )}
              {numberField("Height", btn.size[1], (v) =>
                updateButton(idx, "size", [btn.size[0], v]),
              )}
            </div>
          ))}
          <button
            onClick={addButton}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-3 py-1 rounded text-sm"
          >
            + Add Button
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex flex-col items-center gap-12">
        {/* Back View */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-900">Back View</h2>
          <div
            style={{
              width: phone.width * cmToPx,
              height: phone.height * cmToPx,
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: phone.cornerRadius * cmToPx,
              position: "relative",
            }}
          >
            {backCutouts.map((cutout, idx) => renderCutout(cutout, idx))}

            {/* Height dimension */}
            <div className="absolute -right-8 top-0 w-0.5 h-full bg-gray-400">
              <div className="absolute -left-2 w-5 h-0.5 bg-gray-400" />
              <div className="absolute -left-2 bottom-0 w-5 h-0.5 bg-gray-400" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 px-1 text-xs bg-gray-100 border border-gray-300 rounded whitespace-nowrap">
                {phone.height}mm
              </span>
            </div>

            {/* Width dimension */}
            <div className="absolute -bottom-8 left-0 h-0.5 w-full bg-gray-400">
              <div className="absolute -bottom-2 h-5 w-0.5 bg-gray-400" />
              <div className="absolute -bottom-2 right-0 h-5 w-0.5 bg-gray-400" />
              <span className="absolute left-1/2 top-4 -translate-x-1/2 px-1 text-xs bg-gray-100 border border-gray-300 rounded whitespace-nowrap">
                {phone.width}mm
              </span>
            </div>
          </div>
        </div>

        {/* Side Views */}
        <div className="flex gap-16">
          {/* Left Side */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-900">
              Left Side
            </h2>
            <div
              style={{
                width: phone.depth * cmToPx,
                height: phone.height * cmToPx,
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: phone.cornerRadius * cmToPx,
                position: "relative",
              }}
            >
              {leftButtons.map((btn, idx) => renderCutout(btn, idx))}

              <div className="absolute -bottom-8 left-0 h-0.5 w-full bg-gray-400">
                <div className="absolute -bottom-2 h-5 w-0.5 bg-gray-400" />
                <div className="absolute -bottom-2 right-0 h-5 w-0.5 bg-gray-400" />
                <span className="absolute left-1/2 top-4 -translate-x-1/2 px-1 text-xs bg-gray-100 border border-gray-300 rounded whitespace-nowrap">
                  {phone.depth}mm
                </span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-900">
              Right Side
            </h2>
            <div
              style={{
                width: phone.depth * cmToPx,
                height: phone.height * cmToPx,
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: phone.cornerRadius * cmToPx,
                position: "relative",
              }}
            >
              {rightButtons.map((btn, idx) => renderCutout(btn, idx))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
