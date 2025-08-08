// components/RouteGuard.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { favouritesAtom, searchHistoryAtom } from '@/store';
import { getFavourites, getHistory } from '@/lib/userData';

const PUBLIC_PATHS = ['/login', '/register'];

export default function RouteGuard({ children }) {
  const router = useRouter();
  const [favouritesList, setFavouritesList] = useAtom(favouritesAtom);
  const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom);

  async function updateAtoms() {
    setFavouritesList(await getFavourites());
    setSearchHistory(await getHistory());
  }

  useEffect(() => {
    const token = localStorage.getItem('token'); 

    if (!token && !PUBLIC_PATHS.includes(router.pathname)) {
      router.push('/login');
    } else if (token) {
      updateAtoms();
    }
  }, [router.pathname]);

  if (!favouritesList || !searchHistory) return null;

  return children;
}
