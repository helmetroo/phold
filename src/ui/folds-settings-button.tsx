import Icon from './icon';

interface Props {
    active: boolean,
}
export default function FoldsSettingsButton({ active }: Props) {
    return (
        <button
            aria-label='Folds settings'
            class='w-full h-full cursor-pointer no-highlight-btn transition-colors ease-out duration-10'
        >
            <Icon name='folds-settings' classes={`w-full h-full ${active ? 'stroke-amber-400' : 'stroke-white'}`} />
        </button>
    );
}
