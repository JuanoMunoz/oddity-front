import React from 'react';
import Button from '../components/Button';
import { Bot, Zap, Database, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-7xl mx-auto px-6">
            {/* Hero Section */}
            <section className="py-24 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 text-primary mb-8 font-bold text-[10px] tracking-[0.2em] bg-primary/5 uppercase"
                >
                    <span>AUTOMATIZACIÓN CON IA</span>
                </motion.div>

                <motion.h1
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-8 dark:text-white text-secondary"
                >
                    Optimiza el valor de <br />
                    <span className="text-primary italic">tu equipo humano.</span>
                </motion.h1>

                <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg max-w-2xl dark:text-slate-300 text-slate-600 font-medium leading-relaxed mb-10"
                >
                    Ayudamos a empresas a automatizar tareas repetitivas. Nuestros agentes de IA manejan la atención y clasificación de datos para que tu equipo se enfoque en lo estratégico.
                </motion.p>

                <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Button size="lg" className="px-10 rounded-xl font-bold">
                        Comenzar ahora
                    </Button>
                    <Button variant="outline" size="lg" className="px-10 rounded-xl font-bold">
                        Saber más
                    </Button>
                </motion.div>
            </section>

            {/* Features */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="py-20 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {[
                    { title: "Atención Inteligente", icon: Bot, desc: "Agentes autónomos que resuelven dudas y clasifican leads." },
                    { title: "Gestión de Datos", icon: Database, desc: "Carga y clasificación de información administrativa masiva." },
                    { title: "Flujos de IA", icon: Zap, desc: "Conexión de herramientas y eliminación de cuellos de botella." }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/30 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/10 transition-transform group-hover:scale-110">
                            <item.icon className="text-primary w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 dark:text-white text-secondary">{item.title}</h3>
                        <p className="text-sm dark:text-slate-400 text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </motion.section>

            {/* Value Prop */}
            <section className="py-24 border-t border-slate-200 dark:border-white/5">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-10 dark:text-white text-secondary">¿Por qué <span className="text-primary font-black">Oddity</span>?</h2>
                        <div className="space-y-6">
                            {[
                                "Reducción de costos de hasta un 60%",
                                "Tiempos de respuesta inmediata 24/7",
                                "Escalabilidad ilimitada sin costes fijos",
                                "Foco total en decisiones de valor"
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="p-1 bg-primary/10 rounded-full border border-primary/10">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-base font-bold dark:text-white/80 text-secondary/80 tracking-wide">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 aspect-square md:aspect-video rounded-[3.5rem] shadow-sm flex items-center justify-center p-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bot className="w-24 h-24 text-primary opacity-20 relative z-10 transition-transform group-hover:scale-110" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
