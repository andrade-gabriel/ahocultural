import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const EventDetailLayout = () => {
    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
                {/* Grid principal: 12 colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* ---- Coluna esquerda: conteúdo principal ---- */}
                    <div className="lg:col-span-8">
                        {/* Data + Título */}
                        <p className="text-xl tracking-wide text-muted-foreground">QUI 09.10 2025</p>
                        <h1 className="mt-2 text-5xl font-semibold leading-tight">
                            CHEFE JOÃO NO RASCAL
                        </h1>

                        {/* Tags */}
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-sm px-3 py-1 text-xs">
                                Comida &amp; Bebida
                            </Badge>
                            <Badge variant="outline" className="rounded-sm px-3 py-1 text-xs">
                                Restaurante Árabe
                            </Badge>
                        </div>

                        {/* Infos (4 colunas) */}
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 md:[&>*:not(:first-child)]:border-l">
                            <InfoCell title="ONDE">
                                <div className="font-medium">
                                    Av. Pres. Juscelino Kubitschek, 2041 – Vila Olímpia, São Paulo
                                </div>
                            </InfoCell>

                            <InfoCell title="QUANDO">
                                <div className="text-sm">Quinta-feira, 09 de Outubro 2025</div>
                            </InfoCell>

                            <InfoCell title="VALOR">
                                <div className="text-sm">R$ 200,00</div>
                            </InfoCell>

                            <InfoCell title="CONTATO">
                                <Button variant="link" className="px-0 h-auto">
                                    Ingresso aqui
                                </Button>
                            </InfoCell>
                        </div>

                        {/* Imagem */}
                        <img
                            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop"
                            alt="Capa do evento"
                            className="aspect-[16/9] w-full object-cover"
                        />

                        {/* Descrição */}
                        <div className="mt-8 prose max-w-none">
                            <p className="text-lg leading-relaxed">
                                Pellentesque rhoncus blandit felis, ut imperdiet felis condimentum eget. Vivamus quis ligula efficitur leo molestie maximus ut sed lacus. Suspendisse accumsan, tortor at sagittis dignissim, quam mauris elementum augue, nec consectetur nisl velit nec mi. Morbi auctor auctor imperdiet. Curabitur imperdiet augue nec massa mollis vestibulum. Quisque condimentum auctor nunc, vitae pretium enim tempor non. Curabitur imperdiet ligula eget mauris rutrum eleifend. Donec faucibus, velit quis luctus pretium, tellus velit molestie lacus, sed lobortis massa libero sit amet leo. Aenean urna diam, tincidunt sit amet risus sit amet, dictum viverra tellus. Nullam in lorem ac tellus tincidunt sodales sit amet sit amet dui. Maecenas cursus non mi a pellentesque. Nulla volutpat ipsum nec massa fermentum vestibulum.

                                Pellentesque nec erat id augue volutpat laoreet. Pellentesque suscipit lacus vel tempor semper. Ut aliquam eros volutpat, pulvinar metus id, lobortis lorem. Ut ac sodales felis, et maximus mauris. Nulla vehicula tempor eros, non accumsan eros consequat efficitur. Vivamus velit libero, porttitor vitae facilisis mattis, tempor eu odio. Morbi facilisis id ex eu tempus. Donec eu leo quis metus tincidunt maximus ut eget eros. Donec dictum dignissim ex vel gravida. Ut a risus sit amet tellus consequat volutpat vel sed lorem.
                            </p>
                        </div>
                    </div>

                    {/* ---- Coluna direita: sidebar (VEJA TAMBÉM) ---- */}
                    <aside className="lg:col-span-4 lg:col-start-9 self-start">
                        <h3 className="text-3xl font-semibold tracking-wide mb-6">
                            VEJA TAMBÉM
                        </h3>

                        <div className="space-y-8">
                            <RelatedItem
                                date="DE 10 A 20 OUTUBRO 2025"
                                venue="Museu de Arte Contemporânea, São Paulo"
                                title="Mostra Interativa: A Cidade Invisível"
                                category="EXPOSIÇÃO"
                            />
                            <Separator />

                            <RelatedItem
                                date="12 OUTUBRO 2025"
                                venue="Auditório Ibirapuera, São Paulo"
                                title="Concerto Especial: O Som das Cores"
                                category="MÚSICA"
                            />
                            <Separator />

                            <RelatedItem
                                date="DE 05 A 15 NOVEMBRO 2025"
                                venue="Centro Cultural Banco do Brasil, Rio de Janeiro"
                                title="Festival de Cinema Brasileiro Independente"
                                category="CINEMA"
                            />
                            <Separator />

                            <RelatedItem
                                date="22 NOVEMBRO 2025"
                                venue="Instituto Tomie Ohtake, São Paulo"
                                title="Palestra: Arte, Tecnologia e Futuro"
                                category="PALESTRA"
                            />
                        </div>

                    </aside>
                </div>
            </div>
        </div>
    );
};

/* ------- helpers ------- */

const InfoCell = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className="py-4 pr-6 md:pl-6">
        <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {title}
        </div>
        <div className="mt-2">{children}</div>
    </div>
);

const RelatedItem = ({
    date,
    venue,
    title,
    category,
}: {
    date: string;
    venue: string;
    title: string;
    category: string;
}) => (
    <div className="border-l pl-4">
        <div className="text-xs uppercase text-muted-foreground">{date}</div>
        <div className="mt-1 text-sm font-semibold">{venue}</div>
        <a className="mt-1 block text-lg font-medium leading-snug hover:underline underline-offset-4">
            {title}
        </a>
        <div className="mt-1 text-xs uppercase text-muted-foreground">{category}</div>
    </div>
);
