export type UserProfilePayload = {
  user_profile: {
    identity: {
      primary_mood: string[];
      core_genres: string[];
      energy_floor: number;
    };
    taste_profile: {
      favorite_genres: string[];
      excluded_genres: string[];
      discovery_mode: number;
      explicit_content: boolean;
    };
    vibe_matrix: {
      target_valence: number;
      target_energy: number;
      target_tempo_bpm: number;
      target_acousticness: number;
      target_instrumentalness: number;
    };
  };
};
