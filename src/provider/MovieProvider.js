import {movies$ as getMovies} from '../data/movies';
import {each, filter, find, get, kebabCase, map, remove, slice, uniqBy} from 'lodash';
import Promise from 'bluebird';

const posters = {};
const overviews = {};

const _getPoster = (movie, page = 1, forceFirst = false) => {
    const title = get(movie, 'original_title', movie.title);
    const key = kebabCase(movie.title);
    if (posters[key]) {
        movie.id = parseInt(movie.id);
        movie.poster = posters[key];
        movie.overview = overviews[key];
        return Promise.resolve(movie);
    } else {
        return fetch(`https://api.themoviedb.org/3/search/movie?api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb&include_adult=true&language=fr&page=${page}&query=${title}`)
            .then(response => response.json())
            .then(({total_pages, results}) => {
                let result = find(results, o => {
                    return kebabCase(o.title) === key && o.poster_path;
                });
                if (!result) {
                    if (forceFirst) {
                        result = results[0];
                    } else {
                        if (page <= Math.min(3, total_pages)) {
                            return _getPoster(movie, page + 1);
                        } else {
                            return _getPoster(movie, 1, true);
                        }
                    }
                }
                posters[key] = `http://image.tmdb.org/t/p/w500${get(result, 'poster_path')}`;
                overviews[key] = `${get(result, 'overview')}`;
                movie.id = parseInt(movie.id);
                movie.poster = posters[key];
                movie.overview = overviews[key];
                return movie;
            })
    }
}

const deletedMovies = [];
const likedMovies = [];
const dislikedMovies = [];

export const deleteMovie = id => Promise.resolve(deletedMovies.push(id));

export const likeMovie = id => Promise.resolve(likedMovies.push(id))
    .then(() => undislikeMovie(id))
;
export const unlikeMovie = id => Promise.resolve(remove(likedMovies, likedMovieId => likedMovieId === id));

export const dislikeMovie = id => Promise.resolve(dislikedMovies.push(id))
    .then(() => unlikeMovie(id))
;
export const undislikeMovie = id => Promise.resolve(remove(dislikedMovies, dislikedMovieId => dislikedMovieId === id));

export const getFilters = () => getMovies
    .then(movies => filter(movies, movie => !deletedMovies.includes(movie.id)))
    .then(items => uniqBy(map(items, item => item.category), category => kebabCase(category)));

export const load = (pagination, filters) => getMovies
    .then(items => Promise.map(items, item => _getPoster(item, 1)))
    .then(movies => {
        let items = filter(movies, movie => !deletedMovies.includes(movie.id));
        each(filters, (values, key) => {
            if (values) {
                items = filter(items, item => values.includes(item[key]));
            }
        })

        items = map(items, item => ({
            ...item,
            likes: item.likes + (likedMovies.includes(item.id) ? 1 : 0),
            dislikes: item.dislikes + (dislikedMovies.includes(item.id) ? 1 : 0),
            liked: likedMovies.includes(item.id),
            disliked: dislikedMovies.includes(item.id),
        }));

        return {
            total: items.length,
            filtered: filters && filters.length > 0,
            results: slice(items, (pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)
        }
    })
;
