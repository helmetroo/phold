import { useRef, useContext, useState, useEffect } from 'preact/hooks';
import { batch, useSignalEffect } from '@preact/signals';
import type { Signal } from '@preact/signals';

import Icon from './icon';

import SettingsCtx, { DEFAULT_FOLDS_SETTINGS } from '@/contexts/settings';

import FoldsSettings from '@/types/folds-settings';
import type Callback from '@/types/callback';
import type { NumCallback } from '@/types/callback';

interface Props {
    visible: boolean,
}
export default function FoldsSettingsBar(props: Props) {
    const elemRef = useRef<HTMLElement>(null);

    const {
        settings,
        orientationType
    } = useContext(SettingsCtx);

    // Watch for req'd style updates when orientation and visibility status changes
    useEffect(() => {
        const newOrientationType = orientationType.peek();
        const newVisible = props.visible;
        setStyle(newOrientationType, newVisible);
    }, [props.visible]);

    useSignalEffect(() => {
        const newOrientationType = orientationType.value;
        const newVisible = props.visible;
        setStyle(newOrientationType, newVisible);
    });

    function setStyle(orientationType: OrientationType, visible: boolean) {
        const elem = elemRef.current;
        if (!elem)
            return;

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
            settings.folds.oX.value = DEFAULT_FOLDS_SETTINGS.oX;
            settings.folds.oY.value = DEFAULT_FOLDS_SETTINGS.oY;
            settings.folds.pX.value = DEFAULT_FOLDS_SETTINGS.pX;
            settings.folds.pY.value = DEFAULT_FOLDS_SETTINGS.pY;
            settings.folds.mP.value = DEFAULT_FOLDS_SETTINGS.mP;
            settings.folds.scale.value = DEFAULT_FOLDS_SETTINGS.scale;
        });
    }

    return (
        <section
            ref={elemRef}
            class='flex relative landscape:absolute z-[-1] top-0 portrait:w-full landscape:w-72 landscape:h-full portrait:px-6 portrait:pb-6 portrait:pt-3 bg-neutral-950/70 transition-transform delay-[0.15s]'>
            <menu class='flex flex-row flex-wrap custom-scroll-bar landscape:overflow-y-scroll landscape:p-4'>
                <ScrubInput
                    label='X'
                    value={settings.folds.oX}
                    min={-1}
                    max={1}
                    step={0.01}
                    onValueChange={updateFoldsSettings('oX')}
                />

                <ScrubInput
                    label='Y'
                    value={settings.folds.oY}
                    min={-1}
                    max={1}
                    step={0.01}
                    onValueChange={updateFoldsSettings('oY')}
                />

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
                    min={0.2}
                    max={3.0}
                />

                <Slider
                    name='Mouth padding'
                    icon='mouth-padding'
                    value={settings.folds.mP}
                    onValueChange={updateFoldsSettings('mP')}
                    min={0.2}
                    max={2.0}
                />

                <Slider
                    name='Scale'
                    icon='scale'
                    alignRight
                    value={settings.folds.scale}
                    onValueChange={updateFoldsSettings('scale')}
                    min={1}
                    max={5}
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
    min?: number,
    max?: number,
}
function Slider(props: SliderProps) {
    const {
        name,
        icon,
        alignRight,
        value,
        onValueChange,
        min,
        max,
    } = props;

    const inputId = `phold-setting-${name.toLowerCase().replace(' ', '-')}`;
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
                min={min ?? 0}
                max={max ?? 10}
                step='0.1'
                value={value}
                onInput={onInputChange}
                class='flex-1 portrait:ml-3 portrait:mr-3 portrait:w-full'
            />
            <span class='bg-black text-white p-1 rounded'>
                {value.value.toFixed(1)}
            </span>
        </li>
    );
}

interface ScrubInputProps {
    label: string,
    value: Signal<number>,
    onValueChange: NumCallback,
    step?: number,
    min?: number,
    max?: number,
}
function ScrubInput(props: ScrubInputProps) {
    const {
        label,
        value,
        step,
        min,
        max,
        onValueChange
    } = props;

    const elemRef = useRef<HTMLInputElement>(null);

    function createScrubber(elem: HTMLInputElement) {
        // Code leveraged from mburakerman/numscrubberjs
        // with some necessary changes to get it to work for our inputs
        elem.readOnly = true;
        elem.style.appearance = 'textfield';

        // Create wrapper span
        const span = document.createElement('span');
        document.body.appendChild(span);

        // Don't change the position of inputs in the DOM
        elem.parentElement?.replaceChild(span, elem);
        span.style.position = 'relative';
        span.style.width = '100%';
        span.appendChild(elem);

        // Create input range that will be dragged over
        const range = document.createElement('input');
        range.setAttribute('type', 'range');
        span.appendChild(range);

        // Copy properties from elem into range
        const step = elem.getAttribute('step') ?? '1';
        range.setAttribute('step', step);
        range.value = elem.value;
        range.min = elem.min;
        range.max = elem.max;

        // Range style
        const inputStyle = getComputedStyle(elem);
        range.style.position = 'absolute';
        range.style.margin = inputStyle.margin;
        range.style.left = '0';
        range.style.border = '1px solid transparent';
        range.style.opacity = '0';
        range.style.cursor = 'ew-resize';

        // Make range width & height equal to input elem
        range.style.width = '100%';
        range.style.height = '100%';

        return range;
    }

    function updateValueAndTrigger(this: HTMLInputElement) {
        const newValue = parseFloat(this.value);
        onValueChange(newValue);
    }

    useEffect(() => {
        const range = createScrubber(elemRef.current!);
        range.addEventListener('input', updateValueAndTrigger);

        return () => {
            range.removeEventListener('input', updateValueAndTrigger);
        };
    }, []);

    // The pl-4 on the input pushes its text more to the center
    return (
        <li class='flex flex-row flex-[50%] w-[50%] h-[3rem] items-center'>
            <span class='text-white mx-3'>
                {label}
            </span>
            <input
                ref={elemRef}
                class='bg-black text-white text-center p-1 pl-4 rounded flex-1 w-full'
                type='number'
                value={value}
                step={step ?? 0.1}
                min={min ?? -10}
                max={max ?? 10}
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
        <li class='flex w-full justify-center items-center mt-4'>
            <button
                onClick={onPress}
                class={`${animating ? 'animate-button-press' : ''} w-full p-4 rounded-lg bg-neutral-600 text-white text-sm leading-[0] cursor-pointer transition ease-out duration-10 origin-center hover:bg-neutral-900`}
            >
                RESET
            </button>
        </li>
    );
}
