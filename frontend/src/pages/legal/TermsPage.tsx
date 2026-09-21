// src/pages/legal/TermsPage.tsx
import React from "react";
import LegalLayout from "../../components/legal/LegalLayout";

const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Términos y Condiciones de Servicio"
      version="v1.0"
      lastUpdate="21 de septiembre de 2026"
    >
      <p>
        El presente documento establece los Términos y Condiciones (en
        adelante, los "Términos") que rigen el acceso y uso de la plataforma{" "}
        <strong>Pathfinder Studio</strong>, disponible en{" "}
        <strong>pathfinder-studio-8qe.pages.dev</strong> y sus dominios
        sucesores (en adelante, la "Plataforma" o el "Servicio"), operada por{" "}
        <strong>Pathfinder Studio S.A. de C.V.</strong> (en adelante,
        "Pathfinder" o el "Prestador").
      </p>

      <h2 id="aceptacion">1. Aceptación de los Términos</h2>
      <p>
        El acceso, registro o uso del Servicio implica la aceptación plena,
        expresa y sin reservas de los presentes Términos, así como del{" "}
        <a href="/legal/privacy">Aviso de Privacidad</a> y de cualquier otra
        política complementaria que Pathfinder publique en la Plataforma.
      </p>
      <p>
        Si el Usuario no está de acuerdo con estos Términos, deberá abstenerse
        de utilizar el Servicio.
      </p>

      <h2 id="descripcion">2. Descripción del Servicio</h2>
      <p>
        Pathfinder es una plataforma de generación de contenido mediante
        inteligencia artificial que permite a los Usuarios generar imágenes,
        videos y otros contenidos digitales a través de modelos de IA de
        terceros integrados en la infraestructura de Pathfinder.
      </p>
      <p>
        El Servicio se ofrece en modalidad <strong>beta</strong> durante su
        etapa inicial. Pathfinder podrá modificar, suspender o descontinuar
        funcionalidades del Servicio sin previo aviso.
      </p>

      <h2 id="edad">3. Requisitos de edad</h2>
      <p>
        Para usar el Servicio, el Usuario debe ser mayor de 18 años o contar
        con la autorización expresa de su padre, madre o tutor legal. Al
        registrarse, el Usuario declara cumplir con este requisito.
      </p>

      <h2 id="cuenta">4. Cuenta de Usuario</h2>
      <p>
        Para acceder a las funcionalidades del Servicio, el Usuario debe
        crear una cuenta autenticándose mediante un proveedor de identidad de
        terceros (actualmente Google OAuth). El Usuario es responsable de:
      </p>
      <ul>
        <li>Mantener la seguridad de su cuenta y dispositivos.</li>
        <li>
          Proporcionar información veraz, precisa y actualizada cuando la
          Plataforma lo solicite.
        </li>
        <li>
          Notificar de inmediato cualquier uso no autorizado de su cuenta a{" "}
          <a href="mailto:pathfinder.contacto@gmail.com">
            pathfinder.contacto@gmail.com
          </a>
          .
        </li>
      </ul>
      <p>
        Pathfinder no será responsable por daños derivados del uso no
        autorizado de la cuenta del Usuario cuando dicho uso resulte de la
        negligencia del propio Usuario.
      </p>

      <h2 id="uso-aceptable">5. Uso aceptable</h2>
      <p>El Usuario se compromete a NO utilizar el Servicio para:</p>
      <ul>
        <li>
          Generar contenido ilegal, difamatorio, obsceno, violento, que
          incite al odio, discriminatorio o que vulnere derechos de terceros.
        </li>
        <li>
          Vulnerar derechos de propiedad intelectual, industrial, de imagen o
          de cualquier naturaleza de terceros.
        </li>
        <li>
          Generar contenido sexual explícito que involucre a menores de edad.
        </li>
        <li>
          Crear representaciones falsas de personas reales sin su
          consentimiento (deepfakes no consentidos).
        </li>
        <li>
          Realizar ingeniería inversa, descompilar, desensamblar o intentar
          acceder al código fuente del Servicio.
        </li>
        <li>
          Sobrecargar, automatizar masivamente, introducir malware o realizar
          ataques de denegación de servicio contra la Plataforma.
        </li>
        <li>
          Crear múltiples cuentas para evadir límites técnicos o comerciales.
        </li>
      </ul>
      <p>
        Pathfinder se reserva el derecho de suspender o cancelar cuentas que
        incumplan esta cláusula sin necesidad de aviso previo.
      </p>

      <h2 id="contenido">6. Contenido del Usuario</h2>
      <p>
        El Usuario conserva la titularidad de los derechos patrimoniales sobre
        los prompts y contenidos que genere a través del Servicio, en la
        medida permitida por la legislación aplicable.
      </p>
      <p>
        Al utilizar el Servicio, el Usuario otorga a Pathfinder una licencia
        limitada, no exclusiva y revocable para almacenar, procesar, mostrar y
        transmitir sus contenidos con la única finalidad de prestar el
        Servicio y cumplir con obligaciones legales.
      </p>
      <p>
        Los contenidos generados tienen una <strong>vigencia temporal</strong>{" "}
        limitada. Pathfinder elimina automáticamente las creaciones a los{" "}
        <strong>7 días</strong> de su almacenamiento, salvo que el Usuario las
        exporte o descargue antes de ese plazo.
      </p>

      <h2 id="propiedad">7. Propiedad intelectual de Pathfinder</h2>
      <p>
        Todos los derechos de propiedad intelectual sobre la Plataforma, su
        código fuente, diseño, marca, logotipos, estructura y elementos
        visuales son propiedad exclusiva de Pathfinder Studio S.A. de C.V. o
        de sus licenciantes.
      </p>
      <p>
        El Usuario no adquiere ningún derecho sobre dichos elementos por el
        uso del Servicio.
      </p>
      <p>
        Los modelos de inteligencia artificial utilizados por Pathfinder son
        provistos por terceros bajo sus propias licencias. Pathfinder actúa
        como integrador tecnológico y no reclama titularidad sobre dichos
        modelos.
      </p>

      <h2 id="planes">8. Planes, precios y pagos</h2>
      <p>
        Durante la etapa beta, el Servicio se ofrece con un plan gratuito
        sujeto a límites técnicos razonables (número de generaciones por hora,
        por día y creaciones activas simultáneas).
      </p>
      <p>
        Pathfinder podrá, en el futuro, ofrecer planes de pago con
        funcionalidades adicionales. Cualquier cambio de precios, planes o
        funcionalidades será comunicado con antelación razonable y no afectará
        retroactivamente los derechos adquiridos.
      </p>

      <h2 id="limitaciones">9. Limitaciones y ausencia de garantías</h2>
      <p>
        El Servicio se proporciona <strong>"tal como está"</strong> y{" "}
        <strong>"según disponibilidad"</strong>. Pathfinder no garantiza:
      </p>
      <ul>
        <li>Que el Servicio esté libre de errores o interrupciones.</li>
        <li>
          Que los resultados generados por los modelos de IA sean precisos,
          adecuados o libres de sesgos.
        </li>
        <li>
          Que el Servicio cumpla con expectativas específicas del Usuario.
        </li>
      </ul>
      <p>
        El Usuario reconoce que los sistemas de inteligencia artificial son
        probabilísticos y pueden generar resultados inesperados o incorrectos.
      </p>

      <h2 id="responsabilidad">10. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la legislación mexicana, Pathfinder
        no será responsable por daños indirectos, incidentales, especiales,
        consecuenciales o punitivos, ni por lucro cesante, pérdida de datos o
        interrupción del negocio, derivados del uso o imposibilidad de uso del
        Servicio.
      </p>
      <p>
        La responsabilidad total agregada de Pathfinder frente al Usuario, por
        cualquier causa relacionada con el Servicio, no excederá el monto
        efectivamente pagado por el Usuario a Pathfinder en los últimos seis
        meses previos al hecho generador.
      </p>

      <h2 id="suspension">11. Suspensión y cancelación de cuenta</h2>
      <p>
        Pathfinder podrá suspender o cancelar cuentas que incumplan estos
        Términos, mediante aviso cuando las circunstancias lo permitan.
      </p>
      <p>
        El Usuario puede solicitar la eliminación de su cuenta en cualquier
        momento desde la sección de Configuración. La cuenta entrará en estado
        de eliminación programada durante <strong>30 días</strong>, tras los
        cuales se completará el borrado permanente de los datos asociados.
      </p>
      <p>
        Durante los 30 días, el Usuario puede recuperar su cuenta iniciando
        sesión nuevamente.
      </p>

      <h2 id="modificaciones">12. Modificaciones a los Términos</h2>
      <p>
        Pathfinder podrá actualizar estos Términos. La versión vigente estará
        siempre disponible en la Plataforma con su fecha de última
        actualización. El uso continuado del Servicio tras la publicación de
        cambios constituye aceptación de los mismos.
      </p>

      <h2 id="ley">13. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de los Estados Unidos
        Mexicanos. Cualquier controversia será sometida a la jurisdicción de
        los tribunales competentes en <strong>Saltillo, Coahuila</strong>,
        renunciando las partes a cualquier otro fuero que pudiera
        corresponderles.
      </p>

      <h2 id="contacto">14. Contacto</h2>
      <p>
        Para cualquier consulta relacionada con estos Términos, el Usuario
        puede contactar a:
      </p>
      <ul>
        <li>
          <strong>Razón social:</strong> Pathfinder Studio S.A. de C.V.
        </li>
        <li>
          <strong>RFC:</strong> MACI960302D52
        </li>
        <li>
          <strong>Domicilio:</strong> C. Reynosa 302, Saltillo, Coahuila, CP
          25000, México
        </li>
        <li>
          <strong>Email:</strong>{" "}
          <a href="mailto:pathfinder.contacto@gmail.com">
            pathfinder.contacto@gmail.com
          </a>
        </li>
      </ul>

      <p
        style={{
          marginTop: "48px",
          paddingTop: "24px",
          borderTop: "1px solid var(--pf-border-subtle, #F4F4F5)",
          fontSize: "0.8125rem",
          color: "var(--pf-text-muted, #A1A1AA)",
          textAlign: "center",
        }}
      >
        Última actualización: 21 de septiembre de 2026 · Versión 1.0
      </p>
    </LegalLayout>
  );
};

export default TermsPage;
