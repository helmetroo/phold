interface Props {
    settingsCallback: () => void,
}
export default function SettingsBar({ settingsCallback }: Props) {
    return (
        <section class='flex w-full h-[3rem] bg-neutral-950 relative top-0 justify-center items-center'>
            <menu class='w-full h-full flex flex-row justify-center items-center'>
                <li>
                </li>
            </menu>
        </section>
    );
}
