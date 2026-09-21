// src/pages/legal/PrivacyPage.tsx
import React from "react";
import LegalLayout from "../../components/legal/LegalLayout";

const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Aviso de Privacidad"
      version="v1.0"
      lastUpdate="21 de septiembre de 2026"
    >
      <p>
        En cumplimiento con la <strong>Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares</strong> (LFPDPPP) y su
        Reglamento, <strong>Pathfinder Studio S.A. de C.V.</strong> (en
        adelante, "Pathfinder" o el "Responsable") pone a disposición del
        público el presente Aviso de Privacidad.
      </p>

      <h2 id="responsable">1. Identidad y domicilio del Responsable</h2>
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
          <strong>Email de privacidad:</strong>{" "}
          <a href="mailto:pathfinder.contacto@gmail.com">
            pathfinder.contacto@gmail.com
          </a>
        </li>
      </ul>

      <h2 id="datos">2. Datos personales que recabamos</h2>
      <p>
        Pathfinder recaba los siguientes datos personales, todos de carácter{" "}
        <strong>no sensible</strong>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Datos específicos</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Identificación</td>
            <td>Nombre, correo electrónico, fotografía de perfil</td>
            <td>Google OAuth</td>
          </tr>
          <tr>
            <td>Cuenta</td>
            <td>Nombre de usuario, identificador interno</td>
            <td>Usuario</td>
          </tr>
          <tr>
            <td>Actividad</td>
            <td>Prompts, contenidos generados, fechas de uso</td>
            <td>Servicio</td>
          </tr>
          <tr>
            <td>Técnicos</td>
            <td>Dirección IP (hasheada), agente de usuario, eventos de seguridad</td>
            <td>Servicio</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>No recabamos datos personales sensibles</strong> (origen
        étnico, estado de salud, creencias religiosas, preferencia sexual,
        datos biométricos o financieros).
      </p>

      <h2 id="finalidades-primarias">3. Finalidades primarias del tratamiento</h2>
      <p>
        Sus datos personales serán utilizados para las siguientes finalidades
        necesarias para la prestación del Servicio:
      </p>
      <ul>
        <li>Crear y gestionar su cuenta de usuario.</li>
        <li>Autenticar su identidad al iniciar sesión.</li>
        <li>Prestar el servicio de generación de contenido con IA.</li>
        <li>Almacenar temporalmente sus creaciones (máximo 7 días).</li>
        <li>Atender solicitudes de soporte y aclaraciones.</li>
        <li>
          Enviar notificaciones relacionadas con la operación del Servicio
          (seguridad, cambios en Términos o este Aviso).
        </li>
        <li>
          Cumplir obligaciones legales, fiscales o regulatorias aplicables.
        </li>
      </ul>

      <h2 id="finalidades-secundarias">4. Finalidades secundarias</h2>
      <p>
        De manera adicional, utilizaremos sus datos personales para:
      </p>
      <ul>
        <li>
          Enviar comunicaciones promocionales, encuestas de satisfacción o
          información sobre nuevas funcionalidades.
        </li>
        <li>
          Realizar análisis estadísticos y de uso para mejorar el Servicio.
        </li>
      </ul>
      <p>
        Si usted no desea que sus datos sean tratados para las finalidades
        secundarias, puede manifestarlo enviando un correo a{" "}
        <a href="mailto:pathfinder.contacto@gmail.com">
          pathfinder.contacto@gmail.com
        </a>{" "}
        con el asunto "Negativa finalidades secundarias". La negativa no
        afectará la prestación del Servicio.
      </p>

      <h2 id="transferencias">5. Transferencias de datos personales</h2>
      <p>
        Sus datos personales podrán ser transferidos y/o compartidos con los
        siguientes terceros, sin requerir su consentimiento conforme al
        artículo 37 de la LFPDPPP:
      </p>
      <table>
        <thead>
          <tr>
            <th>Tercero</th>
            <th>Finalidad</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Google LLC</td>
            <td>Servicio de autenticación (OAuth)</td>
          </tr>
          <tr>
            <td>Supabase Inc.</td>
            <td>Base de datos y funciones backend</td>
          </tr>
          <tr>
            <td>Cloudflare Inc.</td>
            <td>Hosting, CDN y almacenamiento de archivos</td>
          </tr>
          <tr>
            <td>Kaggle (Google)</td>
            <td>Infraestructura de cómputo para modelos de IA</td>
          </tr>
        </tbody>
      </table>
      <p>
        Estas transferencias se realizan para cumplir las finalidades del
        Servicio y con terceros que cuentan con sus propias políticas de
        privacidad y medidas de seguridad.
      </p>

      <h2 id="arco">6. Ejercicio de derechos ARCO</h2>
      <p>
        Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar u
        Oponerse</strong> (derechos ARCO) al tratamiento de sus datos
        personales. Para ejercerlos, envíe una solicitud a{" "}
        <a href="mailto:pathfinder.contacto@gmail.com">
          pathfinder.contacto@gmail.com
        </a>{" "}
        incluyendo:
      </p>
      <ul>
        <li>Nombre completo y correo electrónico registrado en Pathfinder.</li>
        <li>Documento que acredite su identidad o representación legal.</li>
        <li>Descripción clara del derecho que desea ejercer.</li>
        <li>
          Cualquier elemento que facilite la localización de sus datos
          personales.
        </li>
      </ul>
      <p>
        Pathfinder responderá en un plazo máximo de <strong>20 días hábiles</strong>{" "}
        contados a partir de la recepción de la solicitud.
      </p>
      <p>
        Usted también puede solicitar la eliminación de su cuenta directamente
        desde la sección <strong>Configuración</strong> de la Plataforma. La
        eliminación se completará después de un periodo de gracia de 30 días.
      </p>

      <h2 id="limitacion">7. Limitación del uso o divulgación</h2>
      <p>
        Para limitar el uso o divulgación de sus datos personales, puede
        enviar su solicitud al correo{" "}
        <a href="mailto:pathfinder.contacto@gmail.com">
          pathfinder.contacto@gmail.com
        </a>
        . Pathfinder mantendrá un listado de usuarios que soliciten no recibir
        comunicaciones promocionales.
      </p>

      <h2 id="cookies">8. Uso de cookies y tecnologías similares</h2>
      <p>
        Pathfinder utiliza almacenamiento local (localStorage) y cookies
        técnicas estrictamente necesarias para:
      </p>
      <ul>
        <li>Mantener la sesión del usuario activa.</li>
        <li>Recordar preferencias de interfaz.</li>
        <li>Garantizar la seguridad del Servicio.</li>
      </ul>
      <p>
        Actualmente no utilizamos cookies de rastreo publicitario ni
        tecnologías de terceros para perfilamiento comercial.
      </p>

      <h2 id="seguridad">9. Medidas de seguridad</h2>
      <p>
        Pathfinder implementa medidas de seguridad administrativas, técnicas y
        físicas para proteger sus datos personales contra daño, pérdida,
        alteración, destrucción o uso no autorizado, incluyendo:
      </p>
      <ul>
        <li>Cifrado en tránsito (HTTPS/TLS).</li>
        <li>
          Autenticación mediante proveedores externos verificados (Google).
        </li>
        <li>
          Control de acceso basado en políticas de seguridad a nivel de fila
          (RLS).
        </li>
        <li>
          Registro de eventos de seguridad con datos de IP seudonimizados.
        </li>
        <li>
          Almacenamiento temporal de creaciones con eliminación automática.
        </li>
      </ul>

      <h2 id="conservacion">10. Conservación de datos</h2>
      <p>
        Los datos personales se conservarán mientras su cuenta permanezca
        activa. Tras la solicitud de eliminación, se mantendrán por un periodo
        de gracia de 30 días para permitir su recuperación, después del cual
        serán eliminados permanentemente.
      </p>
      <p>
        Los registros de eventos de seguridad se conservarán por un máximo de{" "}
        <strong>90 días</strong>, salvo obligación legal de conservación
        superior.
      </p>

      <h2 id="cambios">11. Cambios al Aviso de Privacidad</h2>
      <p>
        Pathfinder podrá modificar este Aviso de Privacidad en cualquier
        momento. La versión vigente estará disponible en la Plataforma con su
        fecha de última actualización. Los cambios sustanciales serán
        comunicados al correo electrónico registrado.
      </p>

      <h2 id="consentimiento">12. Consentimiento</h2>
      <p>
        Al registrarse y utilizar Pathfinder, usted manifiesta haber leído,
        entendido y aceptado los términos del presente Aviso de Privacidad,
        otorgando su consentimiento expreso para el tratamiento de sus datos
        personales conforme a las finalidades aquí descritas.
      </p>

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

export default PrivacyPage;
