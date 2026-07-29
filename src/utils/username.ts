export function generateUsernameFromEmail(email: string): string {
    let username = email.split('@')[0] ?? '';
    username = username.replace(/[^a-zA-Z0-9._-]/g, '');
    username = username.toLowerCase();
    if (username.length < 3) {
        username = 'user' + username;
    }
    username = username.substring(0, 20);
    if (!username) {
        username = 'user';
    }

    return username;
}
