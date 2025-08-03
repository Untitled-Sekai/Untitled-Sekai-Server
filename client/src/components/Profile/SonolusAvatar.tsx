import React from 'react';
import './SonolusAvatar.css';

interface SonolusAvatarProps {
    avatarType: string;
    avatarForegroundType?: string;
    avatarForegroundColor?: string;
    avatarBackgroundType?: string;
    avatarBackgroundColor?: string;
    size?: number;
    className?: string;
}

const SonolusAvatar: React.FC<SonolusAvatarProps> = ({
    avatarType,
    avatarForegroundType,
    avatarForegroundColor,
    avatarBackgroundType,
    avatarBackgroundColor,
    size = 64,
    className = ''
}) => {
    const avatarStyle = {
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative' as const,
        zIndex: 10
    };

    console.log('SonolusAvatar props:', {
        avatarType,
        avatarForegroundType,
        avatarForegroundColor,
        avatarBackgroundType,
        avatarBackgroundColor
    });

    if (avatarType.startsWith('theme-')) {
        return (
            <div 
                className={`sonolus-avatar themed-avatar ${className}`}
                style={{
                    ...avatarStyle,
                    backgroundImage: `url(https://content.sonolus.com/avatar/${avatarType})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat'
                }}
            />
        );
    }

    if (avatarType === 'default') {
        const isThemedBackground = avatarBackgroundType?.startsWith('theme-');

        return (
            <div className={`sonolus-avatar default-avatar ${className}`} style={avatarStyle}>
                <div
                    className={isThemedBackground ? 'themed-avatar-background' : 'avatar-background'}
                    style={
                        isThemedBackground
                            ? {
                                backgroundImage: `url(https://content.sonolus.com/avatar/background/${avatarBackgroundType})`,
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat'
                            }
                            : {
                                backgroundColor: avatarBackgroundColor || '#000020ff',
                                maskImage: 'url(https://content.sonolus.com/avatar/background/default)',
                                maskSize: '100% 100%',
                                maskRepeat: 'no-repeat',
                                WebkitMaskImage: 'url(https://content.sonolus.com/avatar/background/default)',
                                WebkitMaskSize: '100% 100%',
                                WebkitMaskRepeat: 'no-repeat'
                            }
                    }
                />
                {avatarForegroundType && (
                    <div
                        className="avatar-foreground"
                        style={{
                            backgroundColor: avatarForegroundColor || '#ffff00',
                            maskImage: `url(https://content.sonolus.com/avatar/foreground/${avatarForegroundType})`,
                            maskSize: '50% 50%',
                            maskPosition: '50% 50%',
                            maskRepeat: 'no-repeat',
                            WebkitMaskImage: `url(https://content.sonolus.com/avatar/foreground/${avatarForegroundType})`,
                            WebkitMaskSize: '50% 50%',
                            WebkitMaskPosition: '50% 50%',
                            WebkitMaskRepeat: 'no-repeat'
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div 
            className={`sonolus-avatar fallback-avatar ${className}`}
            style={avatarStyle}
        >
            ?
        </div>
    );
};

export default SonolusAvatar;