/**
 * Fills the database with sample data for local development: users, movies and reviews.
 *
 *   npm run seed:sample
 *
 * Re-running is safe: everything this script created last time (users with an
 * @sample.dev email, the movies they added and all their reviews) is removed first,
 * so you always end up with one fresh copy. Data that isn't sample data is left alone.
 *
 * Every sample user's password is SAMPLE_PASSWORD below. The sample admin is
 * admin@sample.dev. Refuses to run with NODE_ENV=production.
 */
import { connectDB, disconnectDB } from '../src/config/db';
import { env } from '../src/config/env';
import { MovieModel } from '../src/modules/movies/movie.model';
import { ReviewModel } from '../src/modules/reviews/review.model';
import { reviewsService } from '../src/modules/reviews/reviews.service';
import { UserModel } from '../src/modules/users/user.model';
import type { Genre } from '../src/shared/constants/movies';
import { hashPassword } from '../src/shared/utils/password';

const SAMPLE_EMAIL_DOMAIN = 'sample.dev';
const SAMPLE_PASSWORD = 'Password123!';

const USERNAMES = [
  'alice',
  'bob',
  'carol',
  'dave',
  'erin',
  'frank',
  'grace',
  'heidi',
  'ivan',
  'judy',
  'mallory',
  'oscar',
];

interface SampleMovie {
  title: string;
  releaseYear: number;
  genres: Genre[];
  director: string;
  actors: string[];
  description: string;
}

const MOVIES: SampleMovie[] = [
  {
    title: 'The Godfather',
    releaseYear: 1972,
    genres: ['crime', 'drama'],
    director: 'Francis Ford Coppola',
    actors: ['Marlon Brando', 'Al Pacino', 'James Caan'],
    description: 'The aging patriarch of a crime dynasty hands control to his reluctant son.',
  },
  {
    title: 'The Shawshank Redemption',
    releaseYear: 1994,
    genres: ['drama'],
    director: 'Frank Darabont',
    actors: ['Tim Robbins', 'Morgan Freeman'],
    description: 'Two imprisoned men bond over a number of years, finding solace and redemption.',
  },
  {
    title: 'Pulp Fiction',
    releaseYear: 1994,
    genres: ['crime', 'thriller'],
    director: 'Quentin Tarantino',
    actors: ['John Travolta', 'Uma Thurman', 'Samuel L. Jackson'],
    description: 'The lives of two mob hitmen, a boxer and a pair of bandits intertwine.',
  },
  {
    title: 'The Dark Knight',
    releaseYear: 2008,
    genres: ['action', 'crime', 'drama'],
    director: 'Christopher Nolan',
    actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    description: 'Batman faces the Joker, a criminal mastermind who wants to watch Gotham burn.',
  },
  {
    title: 'Inception',
    releaseYear: 2010,
    genres: ['action', 'sci-fi', 'thriller'],
    director: 'Christopher Nolan',
    actors: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    description: 'A thief who steals secrets through dreams is asked to plant an idea instead.',
  },
  {
    title: 'Interstellar',
    releaseYear: 2014,
    genres: ['adventure', 'drama', 'sci-fi'],
    director: 'Christopher Nolan',
    actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    description: 'Explorers travel through a wormhole in search of a new home for humanity.',
  },
  {
    title: 'Spirited Away',
    releaseYear: 2001,
    genres: ['animation', 'family', 'fantasy'],
    director: 'Hayao Miyazaki',
    actors: ['Rumi Hiiragi', 'Miyu Irino'],
    description: 'A girl wanders into a world of spirits and must work to free her parents.',
  },
  {
    title: 'Toy Story',
    releaseYear: 1995,
    genres: ['animation', 'comedy', 'family'],
    director: 'John Lasseter',
    actors: ['Tom Hanks', 'Tim Allen'],
    description: "A cowboy doll feels threatened when a space ranger becomes a boy's favorite toy.",
  },
  {
    title: 'The Matrix',
    releaseYear: 1999,
    genres: ['action', 'sci-fi'],
    director: 'Lana Wachowski',
    actors: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'],
    description: 'A hacker learns that reality is a simulation and joins a rebellion against it.',
  },
  {
    title: 'Alien',
    releaseYear: 1979,
    genres: ['horror', 'sci-fi'],
    director: 'Ridley Scott',
    actors: ['Sigourney Weaver', 'Tom Skerritt', 'John Hurt'],
    description: 'The crew of a commercial spaceship is hunted by a deadly creature.',
  },
  {
    title: 'The Shining',
    releaseYear: 1980,
    genres: ['drama', 'horror'],
    director: 'Stanley Kubrick',
    actors: ['Jack Nicholson', 'Shelley Duvall'],
    description: 'A family winters in an isolated hotel where an evil presence takes hold.',
  },
  {
    title: 'Get Out',
    releaseYear: 2017,
    genres: ['horror', 'mystery', 'thriller'],
    director: 'Jordan Peele',
    actors: ['Daniel Kaluuya', 'Allison Williams'],
    description: "A young man uncovers a disturbing secret when visiting his girlfriend's family.",
  },
  {
    title: 'Parasite',
    releaseYear: 2019,
    genres: ['comedy', 'drama', 'thriller'],
    director: 'Bong Joon Ho',
    actors: ['Song Kang-ho', 'Choi Woo-shik', 'Park So-dam'],
    description: 'A poor family schemes its way into employment with a wealthy household.',
  },
  {
    title: 'Amélie',
    releaseYear: 2001,
    genres: ['comedy', 'romance'],
    director: 'Jean-Pierre Jeunet',
    actors: ['Audrey Tautou', 'Mathieu Kassovitz'],
    description: 'A shy waitress decides to change the lives of the people around her.',
  },
  {
    title: 'Before Sunrise',
    releaseYear: 1995,
    genres: ['drama', 'romance'],
    director: 'Richard Linklater',
    actors: ['Ethan Hawke', 'Julie Delpy'],
    description: 'Two strangers meet on a train and spend one night walking through Vienna.',
  },
  {
    title: 'Saving Private Ryan',
    releaseYear: 1998,
    genres: ['drama', 'war'],
    director: 'Steven Spielberg',
    actors: ['Tom Hanks', 'Matt Damon', 'Tom Sizemore'],
    description: 'A squad of soldiers goes behind enemy lines to bring a paratrooper home.',
  },
  {
    title: 'Jurassic Park',
    releaseYear: 1993,
    genres: ['action', 'adventure', 'sci-fi'],
    director: 'Steven Spielberg',
    actors: ['Sam Neill', 'Laura Dern', 'Jeff Goldblum'],
    description: 'A theme park of cloned dinosaurs suffers a catastrophic breakdown.',
  },
  {
    title: 'The Good, the Bad and the Ugly',
    releaseYear: 1966,
    genres: ['western'],
    director: 'Sergio Leone',
    actors: ['Clint Eastwood', 'Eli Wallach', 'Lee Van Cleef'],
    description: 'Three gunslingers compete to find a fortune in buried Confederate gold.',
  },
  {
    title: 'Unforgiven',
    releaseYear: 1992,
    genres: ['drama', 'western'],
    director: 'Clint Eastwood',
    actors: ['Clint Eastwood', 'Gene Hackman', 'Morgan Freeman'],
    description: 'A retired gunfighter takes on one last job, decades after hanging up his guns.',
  },
  {
    title: 'Whiplash',
    releaseYear: 2014,
    genres: ['drama', 'music'],
    director: 'Damien Chazelle',
    actors: ['Miles Teller', 'J.K. Simmons'],
    description: 'A young drummer is pushed to his limits by a ruthless music instructor.',
  },
  {
    title: 'La La Land',
    releaseYear: 2016,
    genres: ['comedy', 'drama', 'music', 'romance'],
    director: 'Damien Chazelle',
    actors: ['Ryan Gosling', 'Emma Stone'],
    description: 'A jazz pianist and an aspiring actress fall in love in Los Angeles.',
  },
  {
    title: 'Schindler’s List',
    releaseYear: 1993,
    genres: ['drama', 'history', 'war'],
    director: 'Steven Spielberg',
    actors: ['Liam Neeson', 'Ben Kingsley', 'Ralph Fiennes'],
    description: 'A German industrialist saves the lives of more than a thousand Jewish refugees.',
  },
  {
    title: 'Se7en',
    releaseYear: 1995,
    genres: ['crime', 'mystery', 'thriller'],
    director: 'David Fincher',
    actors: ['Brad Pitt', 'Morgan Freeman', 'Gwyneth Paltrow'],
    description: 'Two detectives hunt a serial killer who uses the seven deadly sins as motives.',
  },
  {
    title: 'Knives Out',
    releaseYear: 2019,
    genres: ['comedy', 'crime', 'mystery'],
    director: 'Rian Johnson',
    actors: ['Daniel Craig', 'Ana de Armas', 'Chris Evans'],
    description: 'A detective investigates the death of a wealthy crime novelist.',
  },
  {
    title: 'Mad Max: Fury Road',
    releaseYear: 2015,
    genres: ['action', 'adventure', 'sci-fi'],
    director: 'George Miller',
    actors: ['Tom Hardy', 'Charlize Theron'],
    description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.',
  },
  {
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    releaseYear: 2001,
    genres: ['adventure', 'fantasy'],
    director: 'Peter Jackson',
    actors: ['Elijah Wood', 'Ian McKellen', 'Viggo Mortensen'],
    description: 'A hobbit and eight companions set out to destroy a powerful ring.',
  },
  {
    title: 'Paddington 2',
    releaseYear: 2017,
    genres: ['adventure', 'comedy', 'family'],
    director: 'Paul King',
    actors: ['Ben Whishaw', 'Hugh Grant', 'Sally Hawkins'],
    description: 'Paddington is framed for theft and must clear his name from prison.',
  },
  {
    title: 'Free Solo',
    releaseYear: 2018,
    genres: ['documentary'],
    director: 'Elizabeth Chai Vasarhelyi',
    actors: ['Alex Honnold'],
    description: 'Alex Honnold attempts to climb El Capitan without ropes.',
  },
  {
    title: 'Casablanca',
    releaseYear: 1942,
    genres: ['drama', 'romance', 'war'],
    director: 'Michael Curtiz',
    actors: ['Humphrey Bogart', 'Ingrid Bergman'],
    description: 'A nightclub owner must choose between love and helping his old flame escape.',
  },
  {
    title: 'Dune: Part Two',
    releaseYear: 2024,
    genres: ['action', 'adventure', 'sci-fi'],
    director: 'Denis Villeneuve',
    actors: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    description: 'Paul Atreides unites with the Fremen to seek revenge against the conspirators.',
  },
  {
    title: 'Superbad',
    releaseYear: 2007,
    genres: ['comedy'],
    director: 'Greg Mottola',
    actors: ['Jonah Hill', 'Michael Cera'],
    description: 'Two high school friends try to make the most of their last weeks before college.',
  },
  // Left with no reviews on purpose, to exercise the "no ratings yet" case.
  {
    title: 'The Unreviewed Indie',
    releaseYear: 2025,
    genres: ['drama'],
    director: 'Jane Doe',
    actors: [],
    description: 'A small film nobody has reviewed yet.',
  },
];

const REVIEW_TEXTS: Record<'low' | 'mid' | 'high', string[]> = {
  low: [
    'Could not get into it at all.',
    'Way too long and not much happens.',
    'Overhyped. I expected a lot more.',
    '',
  ],
  mid: [
    'Decent, but I probably will not rewatch it.',
    'Some great scenes, some slow ones.',
    'Good performances, the story was just okay.',
    '',
  ],
  high: [
    'An absolute classic. Loved every minute.',
    'Stunning from start to finish.',
    'One of the best films I have seen in years.',
    'Rewatched it twice already.',
    '',
  ],
};

/** Small seeded PRNG (mulberry32), so every run produces the same reviews. */
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(42);
const randInt = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

function textFor(rating: number): string {
  if (rating <= 4) return pick(REVIEW_TEXTS.low);
  if (rating <= 7) return pick(REVIEW_TEXTS.mid);
  return pick(REVIEW_TEXTS.high);
}

const sampleEmailFilter = { email: { $regex: `@${SAMPLE_EMAIL_DOMAIN.replace('.', '\\.')}$` } };

async function removePreviousSampleData() {
  const users = await UserModel.find(sampleEmailFilter, { _id: 1 }).lean();
  const userIds = users.map((u) => u._id);
  const movies = await MovieModel.find({ createdBy: { $in: userIds } }, { _id: 1 }).lean();
  const movieIds = movies.map((m) => m._id);

  // Sample users may have reviewed non-sample movies too; those stats get fixed below.
  const affectedMovieIds = await ReviewModel.distinct('movie', {
    user: { $in: userIds },
    movie: { $nin: movieIds },
  });

  const [reviews, removedMovies, removedUsers] = await Promise.all([
    ReviewModel.deleteMany({ $or: [{ user: { $in: userIds } }, { movie: { $in: movieIds } }] }),
    MovieModel.deleteMany({ _id: { $in: movieIds } }),
    UserModel.deleteMany({ _id: { $in: userIds } }),
  ]);
  for (const id of affectedMovieIds) await reviewsService.recalculateMovieStats(String(id));

  if (removedUsers.deletedCount > 0) {
    console.log(
      `Removed previous sample data: ${removedUsers.deletedCount} users, ` +
        `${removedMovies.deletedCount} movies, ${reviews.deletedCount} reviews`,
    );
  }
}

async function seedSample() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed sample data with NODE_ENV=production');
  }

  await connectDB(env.MONGO_URI);
  await removePreviousSampleData();

  // Hash once and reuse: bcrypt is deliberately slow.
  const password = await hashPassword(SAMPLE_PASSWORD);

  const admin = await UserModel.create({
    username: 'sample_admin',
    email: `admin@${SAMPLE_EMAIL_DOMAIN}`,
    password,
    role: 'admin',
  });
  const users = await UserModel.insertMany(
    USERNAMES.map((name) => ({
      username: name,
      email: `${name}@${SAMPLE_EMAIL_DOMAIN}`,
      password,
      role: 'user',
    })),
  );

  // Skip movies that already exist as real data (unique title + year).
  const movies = [];
  for (const movie of MOVIES) {
    const exists = await MovieModel.exists({
      title: movie.title,
      releaseYear: movie.releaseYear,
    }).collation({ locale: 'en', strength: 2 });
    if (exists) {
      console.log(`Skipping "${movie.title}" (${movie.releaseYear}): already in the database`);
      continue;
    }
    movies.push(await MovieModel.create({ ...movie, createdBy: admin._id }));
  }

  // Each movie gets reviews from a random subset of users, around a per-movie "quality"
  // so averages differ between movies. The last movie is left unreviewed.
  const reviews = [];
  for (const movie of movies) {
    if (movie.title === 'The Unreviewed Indie') continue;
    const quality = randInt(4, 9);
    const reviewers = users.filter(() => random() < 0.6);
    for (const user of reviewers) {
      const rating = Math.min(10, Math.max(1, quality + randInt(-3, 2)));
      reviews.push({ movie: movie._id, user: user._id, rating, text: textFor(rating) });
    }
  }
  await ReviewModel.insertMany(reviews);

  for (const movie of movies) await reviewsService.recalculateMovieStats(String(movie._id));

  console.log(
    `Seeded ${users.length + 1} users, ${movies.length} movies, ${reviews.length} reviews`,
  );
  console.log(`Log in as admin@${SAMPLE_EMAIL_DOMAIN} or alice@${SAMPLE_EMAIL_DOMAIN}`);
  console.log(`Password for every sample user: ${SAMPLE_PASSWORD}`);

  await disconnectDB();
}

seedSample().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});
