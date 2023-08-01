import { useRef, useEffect, useContext } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';

import SettingsCtx from '@/contexts/settings';

import YesButton from './check-button';
import NoButton from './x-button';

import type Callback from '@/types/callback';

interface Props {
    visible: boolean,
    yesCallback: Callback,
    noCallback: Callback,
}
export default function ConfirmActionBar(props: Props) {
    const {
        yesCallback,
        noCallback
    } = props;

    const elemRef = useRef<HTMLElement>(null);

    const {
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
            elem.style.right = '0';
            elem.style.transform = visible ? 'translateX(0%)' : 'translateX(100%)';
        } else if (orientationType === 'landscape-secondary') {
            // 8rem is the width
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
            class='flex z-10 w-full h-[8rem] landscape:w-[8rem] landscape:h-full bg-neutral-950/30 fixed bottom-0 landscape:bottom-auto justify-center items-center transition-transform delay-[0.15s]'>
            <menu class='w-full h-full flex flex-row landscape:flex-col justify-center items-center space-x-8 landscape:space-x-0 landscape:space-y-8'>
                <li class='w-16 h-16'>
                    <YesButton
                        label='Confirm chosen photo'
                        callback={yesCallback}
                    />
                </li>
                <li class='w-16 h-16'>
                    <NoButton
                        label='Reject chosen photo'
                        callback={noCallback}
                    />
                </li>
            </menu>
        </section>
    );
}
