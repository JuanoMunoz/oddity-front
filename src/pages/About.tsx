import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Globe, Target, Cpu, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

const About: React.FC = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-7xl mx-auto px-6">
            {/* Hero Section */}
            <section className="py-24 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-primary/20"
                >
                    <Target className="text-primary w-10 h-10" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-8 dark:text-white text-secondary"
                >
                    Redefiniendo el <br />
                    <span className="text-primary italic">trabajo inteligente.</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl max-w-3xl dark:text-slate-300 text-slate-600 font-medium leading-relaxed mb-10"
                >
                    En Oddity, no solo construimos software de automatización. Diseñamos el puente entre el potencial humano y la eficiencia algorítmica. Nuestra misión es liberar a los equipos de lo mundano para que conquisten lo extraordinario.
                </motion.p>
            </section>

            {/* Values Grid */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
                {[
                    {
                        title: "Diseño Obsidian",
                        icon: Sparkles,
                        desc: "Interfaces ultra-limpias diseñadas para minimizar la carga cognitiva y maximizar el enfoque."
                    },
                    {
                        title: "IA Ética",
                        icon: Shield,
                        desc: "Nuestros agentes operan bajo principios de transparencia y seguridad de grado bancario."
                    },
                    {
                        title: "Impacto Global",
                        icon: Globe,
                        desc: "Capacidad de despliegue internacional, adaptándonos a múltiples idiomas y regulaciones."
                    }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="p-10 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="text-primary w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 dark:text-white text-secondary">{item.title}</h3>
                        <p className="dark:text-slate-400 text-slate-500 font-medium text-base leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </motion.section>

            {/* Content Section - Our Philosophy */}
            <section className="py-24 border-t border-slate-200 dark:border-white/5">
                <div className="grid md:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold mb-8 leading-tight dark:text-white text-secondary">
                            Por qué creemos en <br />
                            <span className="text-primary text-2xl uppercase tracking-[0.2em] font-black">La Simplicidad</span>
                        </h2>
                        <div className="space-y-6 dark:text-slate-300 text-slate-600 font-medium text-lg leading-relaxed">
                            <p>
                                La mayoría de las herramientas empresariales son ruidosas y complejas. En Oddity, aplicamos una filosofía de resta: eliminamos lo innecesario hasta que solo queda el valor puro.
                            </p>
                            <p>
                                Cada línea de código y cada píxel de nuestra interfaz están pensados para que la tecnología desaparezca y el resultado brille.
                            </p>
                        </div>
                        <div className="mt-10 flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full bg-primary/20 border-4 border-white dark:border-dark flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                                        IA
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm font-bold dark:text-slate-400 text-slate-500 tracking-wide">+50 Agentes Desplegados</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="aspect-square bg-white dark:bg-white/5 rounded-[3.5rem] border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center relative overflow-hidden p-12"
                    >
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                        <Cpu className="w-32 h-32 text-primary opacity-20 relative z-10 animate-pulse" />

                        <div className="absolute bottom-10 left-10 p-6 bg-white dark:bg-secondary rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 animate-bounce-slow">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-xs font-bold uppercase tracking-widest dark:text-white/60 text-secondary/60">Status: Running</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="py-32 flex flex-col items-center text-center"
            >
                <div className="p-4 bg-primary/10 rounded-full mb-8 border border-primary/20">
                    <Users className="text-primary w-6 h-6" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight dark:text-white text-secondary">Únete a la nueva era laboral</h2>
                <p className="text-lg dark:text-slate-400 text-slate-500 font-medium max-w-xl mb-10 leading-relaxed">
                    Estamos buscando mentes brillantes y empresas visionarias listas para dar el siguiente paso en la automatización.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="px-12 rounded-2xl h-16 text-lg font-bold">
                        Colaborar ahora <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="lg" className="px-12 rounded-2xl h-16 text-lg font-bold">
                        Ver Roadmap
                    </Button>
                </div>
            </motion.section>
        </div>
    );
};

export default About;
