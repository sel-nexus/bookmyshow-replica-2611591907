import type { CatalogMovie, CatalogRepository, CatalogTheatre } from './catalog.repository';

/** Own catalogue lookup decisions. */
export class CatalogService {
  /** Create the service and reconcile prescribed seed labels. */
  constructor(private readonly repository: CatalogRepository) {
    this.repository.normalizeSeedNames();
  }

  /** List the full movie catalogue. */
  listMovies(): CatalogMovie[] {
    return this.repository.listMovies();
  }

  /** List the full theatre catalogue. */
  listTheatres(): CatalogTheatre[] {
    return this.repository.listTheatres();
  }

  /** Return mapped theatres, or null for an unknown movie. */
  listTheatresForMovie(movieId: number): CatalogTheatre[] | null {
    return this.repository.hasMovie(movieId) ? this.repository.listTheatresForMovie(movieId) : null;
  }
}
