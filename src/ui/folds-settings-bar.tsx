import {
    useRef,
    useEffect,
    useContext,
    useState
} from 'preact/hooks';
import { batch } from '@preact/signals';
import type { Signal } from '@preact/signals';

import Icon from './icon';

import SettingsCtx, { DEFAULT_FOLDS_SETTINGS } from '@/contexts/settings';

import FoldsSettings from '@/types/folds-settings';
import type Callback from '@/types/callback';
import type { NumCallback } from '@/types/callback';

interface Props {
    visible: boolean,
    orientationType: OrientationType,
}
export default function FoldsSettingsBar(props: Props) {
    const {
        visible,
    } = props;

    const elem = useRef<HTMLElement>(null);

    const { settings } = useContext(SettingsCtx);

    useEffect(() => {
        if (!elem.current)
            return;

        setStyleFromOrientationType(
            elem.current,
            props.orientationType
        );
    }, [
        props.visible,
        props.orientationType
    ]);

    function setStyleFromOrientationType(
        elem: HTMLElement,
        orientationType: OrientationType
    ) {
        elem.style.left = 'auto';
        elem.style.right = 'auto';

        if (orientationType === 'landscape-primary') {
            // The 4 - (~0.3rem) comes from the width/height of the settings bar
            // The 0.3rem difference accounts for the little gap in between
            elem.style.left = `-${elem.offsetWidth}`;
            elem.style.transform = visible ? 'translateX(3.7rem)' : 'translateX(-100%)';
        } else if (orientationType === 'landscape-secondary') {
            elem.style.right = `-${elem.offsetWidth}`;
            elem.style.transform = visible ? 'translateX(-100%)' : 'translateX(3.7rem)';
        } else {
            // Not handling portrait-secondary
            elem.style.transform = visible ? 'translateY(0%)' : 'translateY(-100%)';
        }
    }

    function updateFoldsSettings(key: keyof FoldsSettings) {
        return (newValue: number) => {
            settings.folds[key].value = newValue;
        }
    }

    function resetFoldsSettings() {
        batch(() => {
            settings.folds.pX.value = DEFAULT_FOLDS_SETTINGS.pX;
            settings.folds.pY.value = DEFAULT_FOLDS_SETTINGS.pY;
            settings.folds.mP.value = DEFAULT_FOLDS_SETTINGS.mP;
            settings.folds.scale.value = DEFAULT_FOLDS_SETTINGS.scale;
        });
    }

    return (
        <section
            ref={elem}
            class='flex relative landscape:absolute z-[-1] top-0 portrait:w-full landscape:h-full portrait:px-6 portrait:pb-6 portrait:pt-3 bg-neutral-950/70 transition-transform delay-[0.15s]'>
            <menu class='flex flex-row flex-wrap landscape:p-4'>
                <Slider
                    name='Padding X'
                    icon='padding-horiz'
                    value={settings.folds.pX}
                    onValueChange={updateFoldsSettings('pX')}
                />

                <Slider
                    name='Padding Y'
                    icon='padding-vert'
                    alignRight
                    value={settings.folds.pY}
                    onValueChange={updateFoldsSettings('pY')}
                />

                <Slider
                    name='Mouth padding'
                    icon='mouth-padding'
                    value={settings.folds.mP}
                    onValueChange={updateFoldsSettings('mP')}
                />

                <Slider
                    name='Scale'
                    icon='scale'
                    alignRight
                    value={settings.folds.scale}
                    onValueChange={updateFoldsSettings('scale')}
                />

                <ResetButton callback={resetFoldsSettings} />
            </menu>
        </section>
    );
}

interface SliderProps {
    name: string,
    icon: string,
    alignRight?: boolean,
    value: Signal<number>,
    onValueChange: NumCallback,
}
function Slider({ name, icon, alignRight, value, onValueChange }: SliderProps) {
    const inputId = `phold-setting-${name}`;
    const portraitPadding = !!alignRight ? 'portrait:pl-6' : 'portrait:pr-6';

    function onInputChange(e: Event) {
        const value = parseFloat((e.target as HTMLInputElement).value);
        onValueChange(value);
    }

    return (
        <li
            class={`portrait:w-[50%] landscape:w-full h-[3rem] flex flex-row flex-[50%] ${portraitPadding} landscape:space-x-6 items-center`}
        >
            <label for={`#${inputId}`}>
                <span class='sr-only'>{name}</span>
                <Icon name={`folds-settings-${icon}`} classes='w-8 h-8 fill-white' />
            </label>
            <input
                id={inputId}
                type='range'
                min='0'
                max='10'
                step='0.1'
                value={value}
                onInput={onInputChange}
                class='flex-1 portrait:ml-4 portrait:w-full'
            />
        </li>
    );
}

interface ResetButtonProps {
    callback: Callback,
}
function ResetButton({ callback }: ResetButtonProps) {
    const [animating, setAnimating] = useState(false);
    function onPress() {
        setAnimating(true);
        callback();
    }

    return (
        <li class='flex w-full justify-center items-center portrait:mt-4'>
            <button
                onClick={onPress}
                class={`${animating ? 'animate-button-press' : ''} w-full p-4 rounded-lg bg-neutral-600 text-white text-sm leading-[0] cursor-pointer transition ease-out duration-10 origin-center hover:bg-neutral-900`}
            >
                RESET
            </button>
        </li>
    );
}
