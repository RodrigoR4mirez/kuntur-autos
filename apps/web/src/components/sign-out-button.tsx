'use client';

export function SignOutButton() {
  return (
    <button
      type="button"
      className="link-button"
      onClick={async () => {
        await fetch('/auth/sign-out', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        window.location.href = '/';
      }}
    >
      Salir
    </button>
  );
}
