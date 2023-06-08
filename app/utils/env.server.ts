import type {BtnColorValue} from "~/components/colorbutton";

export function getPublicEnv() {
    return {
        BUTTON_COLOR: (process.env.BUTTON_COLOR ?? 'indigo') as BtnColorValue,
    } as const;
}
