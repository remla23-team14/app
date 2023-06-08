export type BtnColorValue = 'indigo' | 'pink';

export default function ColorButton({ color, children }: { color: BtnColorValue, children: any }) {
  if (color !== 'indigo' && color !== 'pink') throw new Error('Invalid color');

  const content = (
    <div className="flex flex-row gap-2 px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      {children}
    </div>
  );

  // Tailwind lol
  if (color === 'indigo') {
    return (
      <div className="bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 rounded-md">
        {content}
      </div>
    );
  } else {
    return (
      <div className="bg-pink-600 hover:bg-pink-500 focus-visible:outline-pink-600 rounded-md">
        {content}
      </div>
    );
  }
}
