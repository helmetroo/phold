import { useRef, useContext } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import type { Signal } from '@preact/signals';

import SettingsCtx from '@/contexts/settings';

import PickImageButton from './pick-image-button';
import Shutter from './shutter';
import SwapCameraButton from './swap-camera-button';

import type Callback from '@/types/callback';
import type { FileCallback } from '@/types/callback';

interface Props {
    visible: Signal<boolean>,
    pickImageCallback: FileCallback,
    shutterCallback: Callback,
    swapCameraCallback: Callback,
}
export default function ShutterBar(props: Props) {
    const {
        visible,
        pickImageCallback,
        shutterCallback,
        swapCameraCallback,
    } = props;

    const elemRef = useRef<HTMLElement>(null);

    const {
        orientationType
    } = useContext(SettingsCtx);

    // Watch for req'd style updates when orientation and visibility status changes
    useSignalEffect(() => {
        const newOrientationType = orientationType.value;
        const newVisible = visible.value;
        setStyle(newOrientationType, newVisible);
    });

    function setStyle(orientationType: OrientationType, visible: boolean) {
        const elem = elemRef.current;
        if (!elem)
            return;

        elem.style.left = 'auto';
        elem.style.right = 'auto';
        if (orientationType === 'landscape-primary') {
            elem.style.right = '0';
            elem.style.transform = visible ? 'translateX(0%)' : 'translateX(100%)';
        } else if (orientationType === 'landscape-secondary') {
            // Width is 8rem
            elem.style.left = '-8rem';
            elem.style.transform = visible ? 'translateX(100%)' : 'translateX(0%)';
        } else {
            // Not handling portrait-secondary
            elem.style.transform = visible ? 'translateY(0%)' : 'translateY(100%)';
        }
    }

    return (
        <section
            ref={elemRef}
            class='flex w-full h-[8rem] landscape:w-[8rem] landscape:h-full bg-neutral-950/30 fixed bottom-0 landscape:bottom-auto justify-center items-center transition-transform delay-[0.15s]'>
            <menu class='w-full h-full flex flex-row landscape:flex-col-reverse justify-center items-center space-x-8 landscape:space-x-0 landscape:space-y-8 landscape:space-y-reverse'>
                <li class='w-16 h-16'>
                    <PickImageButton chooseCallback={pickImageCallback} />
                </li>
                <li class='w-20 h-20'>
                    <Shutter pressCallback={shutterCallback} />
                </li>
                <li class='w-16 h-16'>
                    <SwapCameraButton pressCallback={swapCameraCallback} />
                </li>
            </menu>
        </section>
    );
}
