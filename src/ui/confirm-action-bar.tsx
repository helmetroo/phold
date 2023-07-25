import YesButton from './check-button';
import NoButton from './x-button';

import type Callback from '@/types/callback';

interface Props {
    visible: boolean,
    yesCallback: Callback,
    noCallback: Callback,
}
export default function ConfirmActionBar({ visible, yesCallback, noCallback }: Props) {
    return (
        <section class={`${visible ? 'portrait:translate-y-[0%] landscape:translate-x-[0%]' : 'portrait:translate-y-full landscape:translate-x-full'} flex z-10 w-full h-[8rem] landscape:w-[8rem] landscape:h-full bg-neutral-950 absolute bottom-0 landscape:bottom-auto landscape:right-0 justify-center items-center transition-transform delay-[0.15s]`}>
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
