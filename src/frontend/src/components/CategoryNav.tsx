import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  'Gaming',
  'Music',
  'Education',
  'Entertainment',
  'Sports',
  'Technology',
  'News',
  'Comedy',
  'Film',
  'Science',
];

export default function CategoryNav() {
  return (
    <nav className="space-y-1">
      {CATEGORIES.map((category) => (
        <Button key={category} variant="ghost" className="w-full justify-start" asChild>
          <Link to="/category/$categoryName" params={{ categoryName: category }}>
            {category}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
