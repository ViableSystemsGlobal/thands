// Simple template engine for HTML email templates
export class EmailTemplateEngine {
  private baseTemplate: string = '';
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadTemplates();
  }

  private async loadTemplates() {
    try {
      // Load base template
      this.baseTemplate = await this.loadTemplate('base.html');
      
      // Load specific templates
      this.templates.set('order-confirmation', await this.loadTemplate('order-confirmation.html'));
      this.templates.set('payment-success', await this.loadTemplate('payment-success.html'));
      this.templates.set('newsletter-welcome', await this.loadTemplate('newsletter-welcome.html'));
      this.templates.set('general', await this.loadTemplate('general.html'));
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const response = await fetch(new URL(`./templates/${templateName}`, import.meta.url));
      return await response.text();
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      return '';
    }
  }

  // Simple template variable replacement
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // Handle simple {{variable}} replacements
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
      return variables[variable] ? content : '';
    });

    // Handle loops {{#each array}}...{{/each}}
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = itemTemplate;
        Object.keys(item).forEach(itemKey => {
          const itemRegex = new RegExp(`{{${itemKey}}}`, 'g');
          itemContent = itemContent.replace(itemRegex, item[itemKey] || '');
        });
        return itemContent;
      }).join('');
    });

    // Clean up any remaining template tags
    result = result.replace(/{{[^}]+}}/g, '');

    return result;
  }

  public generateEmail(templateType: string, subject: string, variables: Record<string, any>): { html: string; text: string } {
    try {
      // Get the specific template content
      const templateContent = this.templates.get(templateType) || this.templates.get('general') || '';
      
      // Replace variables in the content template
      const processedContent = this.replaceVariables(templateContent, variables);
      
      // Insert the processed content into the base template
      const finalHtml = this.replaceVariables(this.baseTemplate, {
        subject,
        content: processedContent,
        ...variables
      });

      // Generate plain text version (simple HTML strip)
      const textVersion = this.htmlToText(finalHtml);

      return {
        html: finalHtml,
        text: textVersion
      };
    } catch (error) {
      console.error('Error generating email:', error);
      
      // Fallback to simple template
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>${subject}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">TailoredHands</h2>
            <div>${variables.message || 'Thank you for your order!'}</div>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              TailoredHands - Crafting Elegance, Tailoring Excellence<br>
              sales@tailoredhands.africa
            </p>
          </div>
        </body>
        </html>
      `;

      return {
        html: fallbackHtml,
        text: variables.message || 'Thank you for your order!'
      };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Helper method to format currency
  public static formatCurrency(amount: number, currency: string = 'GHS'): string {
    const symbol = currency === 'GHS' ? '₵' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }

  // Helper method to format date
  public static formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
} 