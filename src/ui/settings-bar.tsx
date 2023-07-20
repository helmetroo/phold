//import type Callback from '@/types/callback';

interface Props {
    //settingsCallback: Callback,
}
export default function SettingsBar({ }: Props) {
    return (
        <section class='flex w-full h-[3rem] landscape:w-[3rem] landscape:h-full bg-neutral-950 justify-center items-center'>
            <menu class='w-full h-full flex flex-row landscape:flex-col justify-center items-center'>
                <li>
                </li>
            </menu>
        </section>
    );
}
