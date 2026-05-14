import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'

const features = [
  {
    title: 'Questões por IA',
    description:
      'Questões geradas e adaptadas por inteligência artificial com base no perfil de cada vestibular.',
    icon: '🧠',
  },
  {
    title: 'Trilhas Progressivas',
    description:
      'Aprenda no seu ritmo com trilhas estilo Duolingo, desbloqueando conteúdo à medida que evolui.',
    icon: '🗺️',
  },
  {
    title: '100% Gratuito',
    description:
      'Sem planos pagos, sem paywall. Todo o conteúdo aberto para qualquer estudante cadastrado.',
    icon: '🎁',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 py-24 flex-1"
        style={{ backgroundColor: '#531A61' }}
      >
        <motion.h1
          className="text-5xl font-bold text-white mb-6 max-w-3xl leading-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Conhecimento que abre asas
        </motion.h1>
        <motion.p
          className="text-lg text-white/80 mb-10 max-w-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Plataforma gratuita de preparação para vestibulares com IA adaptativa,
          trilhas progressivas e conteúdo personalizado para ENEM, FUVEST,
          UNICAMP e mais. Para estudantes de escolas públicas brasileiras.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Link
            to="/cadastro"
            className="inline-block font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition hover:scale-105"
            style={{ backgroundColor: '#FFDC5C', color: '#531A61' }}
          >
            Começar agora — é grátis
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ color: '#531A61' }}
          >
            Por que o Kuaa?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-8 flex flex-col items-center text-center shadow-sm border"
                style={{ borderColor: '#531A61' + '22' }}
              >
                <span className="text-4xl mb-4">{f.icon}</span>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: '#531A61' }}
                >
                  {f.title}
                </h3>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center text-sm"
        style={{ backgroundColor: '#531A61', color: '#FFFFFF99' }}
      >
        🦅 Kuaa — 100% gratuito para estudantes de escolas públicas brasileiras
      </footer>
    </div>
  )
}
