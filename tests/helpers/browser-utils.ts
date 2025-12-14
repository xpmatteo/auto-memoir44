// ABOUTME: Utility functions for browser-based testing with Puppeteer
// ABOUTME: Provides helpers to interact with canvas hex grid and game UI

import type {HexCoord} from '../../src/utils/hex';

/**
 * Generate puppeteer script to click on a hex
 * Uses the game's actual grid configuration
 */
export function generateClickHexScript(hex: HexCoord): string {
    return `
(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'No canvas found';

    const rect = canvas.getBoundingClientRect();

    // Grid config (must match game's actual config from main.ts)
    const hexRadius = 87.7;
    const originX = 90;
    const originY = 182;
    const SQRT3 = Math.sqrt(3);

    // Convert hex to pixel (pointy-top orientation, matches src/utils/hex.ts)
    const q = ${hex.q};
    const r = ${hex.r};
    const horizStep = SQRT3 * hexRadius;
    const vertStep = hexRadius * 1.5;
    const x = originX + horizStep * (q + r / 2);
    const y = originY + vertStep * r;

    // Create click event
    const clickEvent = new MouseEvent('click', {
        clientX: rect.left + x,
        clientY: rect.top + y,
        bubbles: true,
        cancelable: true
    });

    canvas.dispatchEvent(clickEvent);

    return \`Clicked hex (\${q},\${r}) at pixel (\${x.toFixed(0)},\${y.toFixed(0)})\`;
})()
    `.trim();
}

/**
 * Generate puppeteer script to play a card by index (0-based)
 */
export function generatePlayCardScript(cardIndex: number): string {
    return `
(() => {
    const handDisplay = document.getElementById('hand-display');
    if (!handDisplay) return 'No hand-display found';

    const cards = handDisplay.querySelectorAll('img');
    if (cards.length === 0) return 'No cards in hand';

    const cardIndex = ${cardIndex};
    if (cardIndex < 0 || cardIndex >= cards.length) {
        return \`Card index \${cardIndex} out of range (0-\${cards.length-1})\`;
    }

    cards[cardIndex].click();

    return \`Clicked card \${cardIndex} (\${cards[cardIndex].alt})\`;
})()
    `.trim();
}

/**
 * Generate puppeteer script to play a card by name
 */
export function generatePlayCardByNameScript(cardName: string): string {
    return `
(() => {
    const handDisplay = document.getElementById('hand-display');
    if (!handDisplay) return 'No hand-display found';

    const cards = Array.from(handDisplay.querySelectorAll('img'));
    if (cards.length === 0) return 'No cards in hand';

    const targetCard = cards.find(card =>
        card.alt && card.alt.toLowerCase().includes('${cardName.toLowerCase()}')
    );

    if (!targetCard) {
        const availableCards = cards.map(c => c.alt).join(', ');
        return \`Card "${cardName}" not found. Available: \${availableCards}\`;
    }

    targetCard.click();

    return \`Clicked card: \${targetCard.alt}\`;
})()
    `.trim();
}

/**
 * Generate puppeteer script to click a button by text
 */
export function generateClickButtonScript(buttonText?: string): string {
    return `
(() => {
    const buttons = Array.from(document.querySelectorAll('button'));

    ${buttonText ? `
    const targetButton = buttons.find(btn =>
        btn.textContent && btn.textContent.includes('${buttonText}')
    );

    if (!targetButton) {
        const availableButtons = buttons.map(b => b.textContent).join(', ');
        return \`Button "${buttonText}" not found. Available: \${availableButtons}\`;
    }

    targetButton.click();
    return \`Clicked button: \${targetButton.textContent}\`;
    ` : `
    if (buttons.length === 0) return 'No buttons found';

    buttons[0].click();
    return \`Clicked button: \${buttons[0].textContent}\`;
    `}
})()
    `.trim();
}

/**
 * Generate puppeteer script to get current game state info
 */
export function generateGetGameStateScript(): string {
    return `
(() => {
    // Try to get phase from UI
    const phaseElement = document.querySelector('[id*="phase"], [class*="phase"]');
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);

    // Check localStorage
    let storageInfo = 'No game state in localStorage';
    try {
        const storage = localStorage.getItem('memoir-game-state');
        if (storage) {
            const parsed = JSON.parse(storage);
            storageInfo = \`Phase: \${parsed.activePhase?.name || 'unknown'}\`;
        }
    } catch (e) {}

    return {
        phaseText: phaseElement ? phaseElement.textContent : 'Phase element not found',
        buttons: buttons,
        storage: storageInfo
    };
})()
    `.trim();
}
