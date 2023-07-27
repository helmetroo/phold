import { useRef, useEffect } from 'preact/hooks';

import YesButton from './check-button';
import NoButton from './x-button';

import type Callback from '@/types/callback';

interface Props {
    visible: boolean,
    orientationType: OrientationType,
    yesCallback: Callback,
    noCallback: Callback,
}
export default function ConfirmActionBar(props: Props) {
    const {
        visible,
        yesCallback,
        noCallback
    } = props;

    const elem = useRef<HTMLElement>(null);

    // Watch for req'd style updates when orientation and visibility status changes
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
            ref={elem}
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
