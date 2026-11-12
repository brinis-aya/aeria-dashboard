import { useData } from '../data.js'
import { formatTime } from '../atmo.js'
import { Legend, Loading } from '../components.jsx'

export default function About() {
  const { data, error } = useData('meta')
  if (!data) return <Loading error={error} />
  return (
    <article className="prose">
      <h1>À propos</h1>
      <p>
        Aeria est un projet étudiant de plateforme ouverte de surveillance de la qualité de l'air, réalisé par
        BRINIS Aya. Ce tableau de bord est un site statique : il affiche un instantané des données exporté le{' '}
        {formatTime(data.meta.generated_at)}.
      </p>
      <h2>L'indice ATMO</h2>
      <p>
        Indice officiel français (arrêté du 10 juillet 2020), de « Bon » à « Extrêmement mauvais ». Il est
        calculé chaque jour pour cinq polluants. Les particules sont prises en moyenne journalière ; le dioxyde
        d'azote, l'ozone et le dioxyde de soufre en maximum horaire. Le pire sous-indice donne l'indice du jour.
      </p>
      <Legend />
      <p className="muted">
        Les indices de ce site sont calculés par station à partir des mesures temps réel, pré-validées. L'indice
        officiel d'ATMO Normandie est publié par commune et peut différer. Pour toute décision de santé, référez-vous
        à <a href="https://www.atmonormandie.fr">ATMO Normandie</a>.
      </p>
      <h2>Sources et licences</h2>
      <ul>
        {data.meta.sources.map((s) => (
          <li key={s.name}><a href={s.url}>{s.name}</a> — {s.licence}</li>
        ))}
      </ul>
      <h2>Accessibilité</h2>
      <p>
        La couleur n'est jamais le seul porteur d'information : chaque indice est écrit en toutes lettres. Les
        graphiques ont un titre explicite, la navigation se fait au clavier, et le thème sombre suit les réglages
        du système. Écart connu : la carte est décorative pour un lecteur d'écran ; la liste des stations à côté
        de la carte donne la même information.
      </p>
    </article>
  )
}
