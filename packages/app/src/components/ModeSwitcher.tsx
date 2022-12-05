import * as React from "preact";

export type ModeValue = "simplified" | "traditional";

export interface ModeSwitcherProps {
  mode: ModeValue;
  onChange?: (evt: { mode: ModeValue }) => void;
}

export const ModeSwitcher: React.FunctionComponent<ModeSwitcherProps> = (
  props
) => {
  return (
    <div class="mode-switcher">
      <ul>
        <li class={props.mode === "simplified" ? "current" : ""}>
          <a
            href="#"
            onClick={(evt) => {
              evt.preventDefault();
              props.onChange?.({ mode: "simplified" });
            }}
          >
            Simplified
          </a>
        </li>
        <li class={props.mode === "traditional" ? "current" : ""}>
          <a
            href="#"
            onClick={(evt) => {
              evt.preventDefault();
              props.onChange?.({ mode: "traditional" });
            }}
          >
            Traditional
          </a>
        </li>
      </ul>
    </div>
  );
};
